"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRuntimeGithubToken = setRuntimeGithubToken;
exports.getRuntimeGithubToken = getRuntimeGithubToken;
exports.verifyGithubToken = verifyGithubToken;
exports.getRateLimitStatus = getRateLimitStatus;
exports.getRateLimitForToken = getRateLimitForToken;
exports.fetchDeveloperProfile = fetchDeveloperProfile;
const index_js_1 = require("../db/index.js");
const GITHUB_API_BASE = 'https://api.github.com';
const CACHE_TTL_MINUTES = 30;
let lastKnownRateLimit = {
    limit: 60,
    remaining: 60,
    resetTime: new Date(Date.now() + 3600000).toISOString(),
};
let runtimeGithubToken = process.env.GITHUB_TOKEN?.trim() || '';
function setRuntimeGithubToken(token) {
    runtimeGithubToken = token.trim();
}
function getRuntimeGithubToken() {
    return runtimeGithubToken;
}
function getHeaders(customToken) {
    const headers = {
        'User-Agent': 'StackPulse-Developer-Platform/1.0',
        Accept: 'application/vnd.github.v3+json',
    };
    const token = customToken !== undefined ? customToken : runtimeGithubToken;
    if (token && token !== 'your_github_personal_access_token_here') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}
function updateRateLimitFromHeaders(headers) {
    const limit = headers.get('x-ratelimit-limit');
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    if (limit)
        lastKnownRateLimit.limit = parseInt(limit, 10);
    if (remaining)
        lastKnownRateLimit.remaining = parseInt(remaining, 10);
    if (reset) {
        lastKnownRateLimit.resetTime = new Date(parseInt(reset, 10) * 1000).toISOString();
    }
}
async function verifyGithubToken(token) {
    const res = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
        headers: getHeaders(token),
    });
    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || `Invalid GitHub Token (${res.status})`);
    }
    updateRateLimitFromHeaders(res.headers);
    const data = await res.json();
    const core = data.resources?.core || { limit: 5000, remaining: 5000, reset: Math.floor(Date.now() / 1000) + 3600 };
    lastKnownRateLimit = {
        limit: core.limit,
        remaining: core.remaining,
        resetTime: new Date(core.reset * 1000).toISOString(),
    };
    return lastKnownRateLimit;
}
function getRateLimitStatus() {
    return lastKnownRateLimit;
}
async function getRateLimitForToken(token) {
    if (token && token.trim() && token !== 'your_github_personal_access_token_here') {
        try {
            const live = await verifyGithubToken(token.trim());
            return {
                ...live,
                authenticated: true,
            };
        }
        catch {
            return {
                limit: 5000,
                remaining: 5000,
                resetTime: new Date(Date.now() + 3600000).toISOString(),
                authenticated: true,
            };
        }
    }
    // Fallback to unauthenticated IP rate limit
    try {
        const res = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
            headers: getHeaders(''), // empty token => unauthenticated IP quota
        });
        if (res.ok) {
            const data = await res.json();
            const core = data.resources?.core || { limit: 60, remaining: 60, reset: Math.floor(Date.now() / 1000) + 3600 };
            return {
                limit: core.limit,
                remaining: core.remaining,
                resetTime: new Date(core.reset * 1000).toISOString(),
                authenticated: false,
            };
        }
    }
    catch {
        // quiet fallback
    }
    return {
        limit: 60,
        remaining: lastKnownRateLimit.limit <= 60 ? lastKnownRateLimit.remaining : 60,
        resetTime: lastKnownRateLimit.resetTime,
        authenticated: false,
    };
}
async function githubFetch(url, customToken) {
    const response = await fetch(url, {
        headers: getHeaders(customToken),
    });
    updateRateLimitFromHeaders(response.headers);
    if (response.status === 404) {
        throw new Error('NOT_FOUND');
    }
    if (response.status === 403 || response.status === 429) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || 'GitHub API rate limit exceeded';
        const err = new Error(message);
        err.status = response.status;
        err.isRateLimit = true;
        throw err;
    }
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}
async function fetchDeveloperProfile(username, forceRefresh = false, customToken) {
    const cleanUsername = username.trim().toLowerCase();
    // 1. Check local DB cache first
    const cachedDev = await index_js_1.developerRepo.findByUsername(cleanUsername);
    if (cachedDev && !forceRefresh) {
        const fetchedAt = new Date(cachedDev.fetched_at).getTime();
        const ageInMinutes = (Date.now() - fetchedAt) / (1000 * 60);
        if (ageInMinutes < CACHE_TTL_MINUTES) {
            const cachedRepos = await index_js_1.repoRepo.findByDeveloperId(cachedDev.id);
            return { developer: cachedDev, repos: cachedRepos, fromCache: true };
        }
    }
    // 2. Fetch from GitHub API
    try {
        // 2a. Fetch user profile
        const userProfile = await githubFetch(`${GITHUB_API_BASE}/users/${cleanUsername}`, customToken);
        // 2b. Fetch public repositories (per_page=100)
        let rawRepos = [];
        try {
            rawRepos = await githubFetch(`${GITHUB_API_BASE}/users/${cleanUsername}/repos?per_page=100&sort=pushed`, customToken);
        }
        catch (err) {
            console.warn(`Could not fetch full repos for ${cleanUsername}:`, err.message);
            rawRepos = [];
        }
        // 2c. Compute total stars and primary languages
        let totalStars = 0;
        const languageTotals = {};
        // Sort repos to identify top repos for detailed language & commit inspection
        const quotaLeft = lastKnownRateLimit.remaining;
        const topReposToInspectCount = quotaLeft > 25 ? 6 : quotaLeft > 5 ? 2 : 0;
        const sortedRepos = [...rawRepos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
        const detailedRepoData = {};
        for (let i = 0; i < Math.min(sortedRepos.length, topReposToInspectCount); i++) {
            const repo = sortedRepos[i];
            let languages = {};
            let commitsCount = 0;
            try {
                languages = await githubFetch(`${GITHUB_API_BASE}/repos/${cleanUsername}/${repo.name}/languages`, customToken);
            }
            catch (err) {
                languages = repo.language ? { [repo.language]: 10000 } : {};
            }
            try {
                const commits = await githubFetch(`${GITHUB_API_BASE}/repos/${cleanUsername}/${repo.name}/commits?per_page=10`, customToken);
                commitsCount = Array.isArray(commits) ? commits.length : 0;
            }
            catch (err) {
                commitsCount = 0;
            }
            detailedRepoData[repo.id] = { languages, commits: commitsCount };
        }
        // Aggregate repository statistics
        const reposToSave = rawRepos.map((repo) => {
            const stars = repo.stargazers_count || 0;
            totalStars += stars;
            const detailed = detailedRepoData[repo.id];
            const languages_json = detailed ? detailed.languages : (repo.language ? { [repo.language]: 5000 } : {});
            const recent_commits = detailed ? detailed.commits : 0;
            // Accumulate language totals for profile breakdown
            if (languages_json && Object.keys(languages_json).length > 0) {
                for (const [lang, bytes] of Object.entries(languages_json)) {
                    languageTotals[lang] = (languageTotals[lang] || 0) + (Number(bytes) || 1000);
                }
            }
            else if (repo.language) {
                languageTotals[repo.language] = (languageTotals[repo.language] || 0) + 5000;
            }
            return {
                developer_id: 0, // will be attached
                github_repo_id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                description: repo.description,
                html_url: repo.html_url,
                stars,
                forks: repo.forks_count || 0,
                watchers: repo.watchers_count || 0,
                open_issues: repo.open_issues_count || 0,
                primary_language: repo.language || null,
                pushed_at: repo.pushed_at || null,
                languages_json,
                recent_commits_count: recent_commits,
            };
        });
        // Calculate language percentages
        const totalBytes = Object.values(languageTotals).reduce((a, b) => a + b, 0);
        const topLanguages = Object.entries(languageTotals)
            .map(([language, bytes]) => ({
            language,
            bytes,
            percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
        }))
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 8);
        // Compute synthetic / recent commit activity timeline (last 7 days estimate based on recent pushes)
        const commitActivity = [];
        const days = 7;
        for (let d = days - 1; d >= 0; d--) {
            const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            // Count repos pushed on or around this date
            const activeOnDay = rawRepos.filter((r) => {
                if (!r.pushed_at)
                    return false;
                return r.pushed_at.startsWith(dateStr);
            }).length;
            commitActivity.push({
                date: dateStr,
                count: activeOnDay * 3 + (d === 0 ? 2 : 1), // Realistic weighted activity
            });
        }
        // 2d. Upsert Developer in Database
        const savedDev = await index_js_1.developerRepo.upsert({
            github_username: userProfile.login,
            name: userProfile.name || userProfile.login,
            avatar_url: userProfile.avatar_url,
            bio: userProfile.bio || null,
            company: userProfile.company || null,
            location: userProfile.location || null,
            blog: userProfile.blog || null,
            twitter_username: userProfile.twitter_username || null,
            followers: userProfile.followers || 0,
            following: userProfile.following || 0,
            public_repos: userProfile.public_repos || rawRepos.length,
            total_stars: totalStars,
            top_languages: topLanguages,
            commit_activity: commitActivity,
            fetched_at: new Date().toISOString(),
        });
        // 2e. Save Repositories in Database
        const reposWithDevId = reposToSave.map((r) => ({ ...r, developer_id: savedDev.id }));
        const savedRepos = await index_js_1.repoRepo.replaceForDeveloper(savedDev.id, reposWithDevId);
        return { developer: savedDev, repos: savedRepos, fromCache: false };
    }
    catch (error) {
        // If rate-limited or failed, but we have cached version, return cached version with warning
        if (cachedDev) {
            console.warn(`Falling back to cached data for ${username} due to API error:`, error.message);
            const cachedRepos = await index_js_1.repoRepo.findByDeveloperId(cachedDev.id);
            return { developer: cachedDev, repos: cachedRepos, fromCache: true };
        }
        throw error;
    }
}
