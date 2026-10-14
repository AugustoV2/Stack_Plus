export interface User {
  id: number;
  email: string;
  password_hash: string;
  github_token?: string | null;
  created_at: string;
}

export interface LanguageStat {
  language: string;
  bytes: number;
  percentage: number;
}

export interface CommitDayStat {
  date: string;
  count: number;
}

export interface Developer {
  id: number;
  github_username: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  followers: number;
  following: number;
  public_repos: number;
  total_stars: number;
  top_languages: LanguageStat[];
  commit_activity: CommitDayStat[];
  fetched_at: string;
  created_at: string;
}

export interface Repo {
  id: number;
  developer_id: number;
  github_repo_id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  primary_language: string | null;
  pushed_at: string | null;
  languages_json: Record<string, number>;
  recent_commits_count: number;
  created_at?: string;
  is_pinned?: boolean;
  pin_details?: {
    id: number;
    note: string | null;
    tags: string[];
    created_at: string;
  } | null;
}

export interface Comparison {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  developers?: Developer[];
}

export interface Pin {
  id: number;
  user_id: number;
  repo_id: number;
  note: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  repo?: Repo;
  developer?: Developer;
}
