# ⚡ StackPulse — Developer Intelligence & Comparison Platform

[![Node.js](https://img.shields.io/badge/Node.js-v25-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**StackPulse** is a full-stack developer intelligence web application that allows users to look up GitHub developers, explore profiles and repositories, and compare multiple developers head-to-head using metrics such as total stars, programming language distribution, and commit velocity.

Users can create accounts, pin favorite repositories, annotate them with custom notes and tags, and save named comparisons to revisit later.

---

## 🌟 Key Features

1. **User Authentication & Privacy**:
   - Secure email + password (or PIN) registration and login using JWT & bcrypt.
   - User data privacy: Pinned repositories, annotations, and comparisons are strictly private to each user.
   - Evaluator-friendly 1-Click Demo Login (`demo@stackpulse.dev`).

2. **Real-Time Developer Profiles**:
   - Live GitHub API data retrieval: profile avatar, bio, company, location, followers, following, public repositories, and total stars.
   - **Language Distribution**: Interactive breakdown showing bytes and percentages across all detected programming languages.
   - **Commit Velocity Chart**: 7-day commit and push activity timeline.
   - **Intelligent Database Caching**: Profiles are cached with a 30-minute TTL to optimize performance and prevent rate limiting.
   - **On-Demand Cache Invalidation**: "Sync GitHub" button to re-fetch live data at any time.

3. **Signature Feature: Head-to-Head Compare View**:
   - Compare 2, 3, or more developers side-by-side.
   - Winner badges dynamically computed for each category (👑 Most Stars, 🚀 Most Active, 👥 Most Followers, 📦 Most Repositories).
   - Proportional bar charts comparing metrics across all selected developers.
   - Unified Programming Language Overlap matrix.
   - Quick preset battles (e.g., *Dan Abramov vs Evan You*, *Linus Torvalds vs Anthony Fu*, *TJ Holowaychuk vs Sindre Sorhus*).

4. **Curate: Pinned Repositories & Annotations**:
   - Pin any repository to your personal curated collection.
   - Attach personal notes (key architectural patterns, code insights, learning takeaways).
   - Add custom tags (`#architecture`, `#fullstack`, `#performance`, `#inspiration`) with one-click filtering.
   - Full CRUD: View, add, update notes/tags, and unpin.

5. **Saved Comparisons**:
   - Save custom named comparisons (e.g. *"Frontend Framework Titans"*).
   - Revisit and launch any saved comparison with a single click.
   - Full deletion and management controls.

6. **Rate-Limit Resilient Architecture**:
   - Live GitHub API quota counter in the navbar (remaining requests, total limit, reset time).
   - Tiered repository inspection to preserve API budget.
   - Optional `GITHUB_TOKEN` support to unlock 5,000 requests/hour.

7. **Mobile Responsive**:
   - Fully responsive design engineered to display cleanly on phones, tablets, and desktops.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons |
| **Backend** | Node.js, Express 5, TypeScript (`tsx`), JSONWebToken, Bcrypt.js |
| **Database** | PostgreSQL 13+ (Primary) with automated schema migration + Embedded resilient fallback engine |
| **External API** | GitHub REST API v3 |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended, tested on Node v25)
- **npm** (v9 or higher)
- *(Optional)* **PostgreSQL** (v13 or higher). If PostgreSQL is not installed, StackPulse automatically uses its built-in persistent storage fallback so you can test immediately with zero setup!

### 1. Clone & Install Dependencies

From the root directory of the project:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 2. Configure Environment Variables

The server includes default settings that work out of the box. To customize, edit `server/.env`:

```env
PORT=5000
NODE_ENV=development

# JWT Secret Key
JWT_SECRET=stackpulse_secure_jwt_token_secret_key_2026_x89a

# Optional: GitHub Personal Access Token
# Unauthenticated requests are limited to 60/hr.
# Adding a token increases your rate limit to 5,000/hr.
GITHUB_TOKEN=

# Optional: PostgreSQL Database Connection URL
# If omitted or offline, StackPulse automatically activates the resilient fallback database.
DATABASE_URL=postgresql://postgres:password@localhost:5432/stackpulse
```

### 3. Run the Application

From the root directory, launch both the backend API and frontend client with a single command:

```bash
npm run dev
```

- **Client App**: [http://localhost:3000](http://localhost:3000)
- **REST API Backend**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🗄️ Database Schema & PostgreSQL Setup

The complete relational schema DDL is located at [`server/src/db/schema.sql`](file:///F:/vs%20code/Stack_Plus/server/src/db/schema.sql).

### PostgreSQL Tables:
- `users`: User authentication credentials (email, hashed password, timestamps).
- `developers`: Cached GitHub developer profiles and computed aggregate metrics.
- `repos`: Repository details, star counts, primary languages, commit activity.
- `comparisons`: Named comparisons saved by users.
- `comparison_devs`: Many-to-many relationship linking comparisons to developers.
- `pins`: User-pinned repositories with personal notes and custom tag arrays.

*(When `DATABASE_URL` is configured, StackPulse automatically applies these schema tables and indexes on server startup).*

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Sign in with email & password | No |
| `GET` | `/api/auth/me` | Fetch currently logged in user session | **Yes** |
| `GET` | `/api/developers/:username` | Lookup developer profile, repos & metrics | Optional |
| `POST` | `/api/developers/:username/refresh` | Force re-sync developer from GitHub | Optional |
| `GET` | `/api/developers/recent` | Get recently viewed developers | No |
| `POST` | `/api/compare` | Compare multiple developers head-to-head | No |
| `GET` | `/api/comparisons` | List saved comparisons for current user | **Yes** |
| `POST` | `/api/comparisons/save` | Save a named comparison | **Yes** |
| `DELETE` | `/api/comparisons/:id` | Delete a saved comparison | **Yes** |
| `GET` | `/api/pins` | Get all pinned repos with notes & tags | **Yes** |
| `POST` | `/api/pins` | Pin a repository with optional notes & tags | **Yes** |
| `PUT` | `/api/pins/:id` | Update notes or tags on a pinned repo | **Yes** |
| `DELETE` | `/api/pins/:id` | Unpin a repository | **Yes** |
| `GET` | `/api/system/rate-limit` | Check current GitHub API rate limit quota | No |

---

## 🎥 Demo Walkthrough Video

A complete end-to-end recording of the StackPulse application is included in the repository:
- **Demo Video File**: [`demo_walkthrough.webp`](file:///F:/vs%20code/Stack_Plus/demo_walkthrough.webp)

---

## 📄 Technical Decisions & Architecture Notes

Detailed notes explaining rate-limit mitigations, data models, design decisions, and architectural trade-offs are available in:
- [`TECHNICAL_DECISIONS.md`](file:///F:/vs%20code/Stack_Plus/TECHNICAL_DECISIONS.md)

---

## 📬 Submission Details

- **Project Name**: StackPulse
- **Author**: Full-Stack Development Assignment Submission
- **Submission Email**: `protoformtechnologies@gmail.com`
- **Deadline**: Friday, 16 October, 10:00 AM
