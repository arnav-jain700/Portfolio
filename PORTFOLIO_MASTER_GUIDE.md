# 🚀 Portfolio Master Architecture, Blueprint & Setup Specification

> **Document Purpose**: This comprehensive specification file contains the complete system architecture, database schemas, page layouts, AI integration details, admin authentication, and building instructions for the **ALL_ME Developer Portfolio SPA**. You can provide this file directly to **Antigravity** (or any AI agent / developer) on any machine to reconstruct, run, customize, or deploy the entire portfolio from scratch.

---

## 1. Project Overview & Architecture

* **Type**: High-Performance Framework-less **Single-Page Application (SPA)**.
* **Build System**: **Vite 6+** (Vanilla JavaScript ES6+ modules, minified CSS/JS bundles).
* **Cloud Database & Storage**: **Supabase (PostgreSQL)** with Row-Level Security (RLS) + instant browser `localStorage` fast-read cache.
* **AI Engine**: **Groq API** running Meta's **`llama-3.3-70b-versatile`** (600+ tokens/sec inference) with client-side direct calling + Vercel Serverless proxy fallback.
* **Visual Styling**: Glassmorphism & Cyber-Minimalist Dark/Light theme with CSS Custom Properties, smooth transitions, and responsive flex/grid layouts.
* **Interactive 3D**: Custom WebGL particle canvas background with responsive mouse-gravity physics.
* **Print / Export Engine**: Built-in ATS-friendly printable Resume and CV generator with dedicated print stylesheets (`?print=resume`, `?print=cv`).
* **Deployment Platform**: **Vercel** with GitHub CI/CD and Serverless Edge Functions (`/api/`).

---

## 2. Directory Tree & File Inventory

```text
ALL_ME/
├── api/
│   ├── gemini.js         # Universal Serverless AI Proxy (Groq Llama 3.3 70B with Gemini fallback)
│   └── status.js         # Serverless health-check endpoint for live AI keys
├── public/
│   ├── favicon.svg       # SVG Logo icon
│   ├── icons.svg         # SVG sprite sheet
│   ├── llms.txt          # LLM-readable summary for AI search engines & crawlers
│   ├── robots.txt        # Web crawler configuration
│   └── sitemap.xml       # SEO Sitemap
├── src/
│   ├── ai.js             # Groq AI client, system prompts, job-fit analyzer, and email drafter
│   ├── data.js           # Database layer, Supabase cloud sync, backup/restore & cache logic
│   ├── main.js           # Router, UI controllers, 3D particle canvas, and print router
│   ├── style.css          # Design tokens, glassmorphism, responsive grids, and print stylesheet
│   └── supabase.js       # Supabase JS client initializer
├── index.html            # Main SPA entrypoint containing all public views, modals, & admin console
├── package.json          # Vite + @supabase/supabase-js dependencies
├── PORTFOLIO_MASTER_GUIDE.md # This complete specification document
└── vercel.json           # Vercel deployment routing configuration
```

---

## 3. Database Schema (Supabase PostgreSQL SQL Script)

Execute the following SQL script inside the **Supabase SQL Editor** to initialize all tables, indexes, and Row-Level Security (RLS) policies:

```sql
-- 1. Portfolio Settings & Profile Bio
CREATE TABLE IF NOT EXISTS portfolio_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  ownerName TEXT DEFAULT 'Arnav Jain',
  ownerBio TEXT DEFAULT '',
  email TEXT DEFAULT 'arnavjain1905@gmail.com',
  location TEXT DEFAULT 'Ludhiana, Punjab, India',
  linkedin TEXT DEFAULT 'https://www.linkedin.com/in/arnav-jain007/',
  github TEXT DEFAULT 'https://github.com/arnav-jain700',
  codolio TEXT DEFAULT 'https://codolio.com/profile/Jarnav',
  medium TEXT DEFAULT 'https://medium.com/@arnav4334',
  groqKey TEXT DEFAULT '',
  geminiKey TEXT DEFAULT '',
  categories JSONB DEFAULT '["Frontend", "Backend", "Databases", "DevOps", "Version Control"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Technical Skills & Toolkit
CREATE TABLE IF NOT EXISTS portfolio_tech_stacks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  level INT DEFAULT 80,
  icon TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Featured Projects
CREATE TABLE IF NOT EXISTS portfolio_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Development',
  description TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  githubUrl TEXT DEFAULT '',
  liveUrl TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Professional & Academic Journey (Timeline)
CREATE TABLE IF NOT EXISTS portfolio_timeline (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT DEFAULT 'Student',
  dateRange TEXT DEFAULT '',
  type TEXT DEFAULT 'education',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Certificates & Credentials
CREATE TABLE IF NOT EXISTS portfolio_certificates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  issuer TEXT DEFAULT '',
  date TEXT DEFAULT '',
  credentialUrl TEXT DEFAULT '',
  skills TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Hackathons & Competitions
CREATE TABLE IF NOT EXISTS portfolio_hackathons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT DEFAULT '',
  date TEXT DEFAULT '',
  role TEXT DEFAULT '',
  projectName TEXT DEFAULT '',
  achievement TEXT DEFAULT '',
  description TEXT DEFAULT '',
  technologies TEXT DEFAULT '',
  projectUrl TEXT DEFAULT '',
  certificateUrl TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Blog Articles
CREATE TABLE IF NOT EXISTS portfolio_blog (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  content TEXT DEFAULT '',
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Contact Inquiries & Inbox
CREATE TABLE IF NOT EXISTS portfolio_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  unread BOOLEAN DEFAULT TRUE
);

-- ENABLE ROW-LEVEL SECURITY & ANON POLICIES
ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_tech_stacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_blog ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
  tbl TEXT;
BEGIN 
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'portfolio_%' 
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS "Public Read" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Public Read" ON %I FOR SELECT USING (true);', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Anon Write" ON %I;', tbl);
    EXECUTE format('CREATE POLICY "Anon Write" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
  END LOOP; 
END $$;
```

---

## 4. Complete Page & Feature Breakdown

### A. Navigation & Shell Layout
* **Brand Logo**: SVG animated pulsing logo linking to `#home`.
* **Nav Links**: `#home`, `#journey`, `#skills`, `#projects`, `#certificates`, `#hackathons`, `#job-scanner`, `#contact`.
* **Theme Toggle**: Dark / Light mode toggle with persistent `localStorage` memory (`theme-dark` / `theme-light`).
* **Admin Lock Button**: Lock icon in the navbar that triggers the Admin Passcode modal.
* **Mobile Drawer**: Responsive slide-in navigation drawer for mobile and tablet screens.

### B. Home / Hero Page (`#home`)
* **3D Particle Canvas Background**: HTML5 Canvas particle system calculating distance formulas, connecting nearby nodes with dynamic opacity lines, and repelling from mouse position.
* **Developer Persona Bio**: Real-time synchronized name, bio, location, and social links (GitHub, LinkedIn, Codolio, Medium).
* **Live Stat Counters**: Real-time project counter, skill counter, and AI engine status badge (`Groq Llama 3.3` / `Offline Sandbox`).
* **3D Featured Projects Carousel**: Smooth auto-rotating interactive carousel with drag/swipe, arrow buttons, and dot pagination.
* **Action CTAs**: "Explore My Projects", "Talk to My AI Co-Pilot", "Download Resume (PDF)", and "Download CV (PDF)".

### C. Academic & Professional Journey (`#journey`)
* **Timeline Node Tree**: Chronological timeline displaying degrees, certifications, and work experience.
* **Type Badges**: Distinct visual styling for `Education` vs `Experience`.
* **Metadata**: Displays Degree/Role, School/Company, Date Range, and expanded curriculum descriptions.

### D. Technical Toolkit & Skills (`#skills`)
* **Dynamic Skill Categorization**: Categorizes technical skills into *Frontend, Backend, Databases, DevOps, Version Control*, or custom user-defined categories.
* **Proficiency Bars**: Visual progress percentage meters with smooth CSS ease-in fill animations.

### E. Projects Hub (`#projects`)
* **Interactive Tag Filters**: Filter projects by clicking technology badges (`C++`, `Three.js`, `Python`, `FastAPI`, etc.).
* **Project Cards**: Glassmorphism cards featuring project category, title, description, tags, and action buttons (`Live Demo ↗`, `GitHub Repo ↗`).
* **Detail Modal**: Full-screen modal for deep-dive exploration of selected project architecture.

### F. Certificates & Credentials (`#certificates`)
* **Credential Verification**: Direct links to official issuing bodies (Coursera, Google Cloud, DeepLearning.AI, IBM, Meta).
* **Skills Association**: Lists relevant technologies covered by each certification.
* **Certificate Image Preview**: Full-screen lightbox zoom on credential images.

### G. Hackathons & Competitions (`#hackathons`)
* **Achievement Badges**: Distinct visual badges for 🏆 1st Winner and 🎖️ Finalist awards.
* **Event Metadata**: Organizer, date, team role, project description, and technology tags.
* **Direct Links**: Links to project demos and official certificates.

### H. AI Recruiter Job-Fit Analyzer (`#job-scanner`)
* **Instant Candidate Fit Evaluation**: Paste any Job Description (JD) to receive an automated analysis via Groq Llama 3.3 70B:
  * **Fit Score (0–100%)**
  * **Key Strengths matching the JD**
  * **Gap Analysis & Missing Competencies**
  * **Relevant Projects from your portfolio to highlight**
* **Offline Fallback Engine**: If no API key is present, computes match scores using semantic token overlap.

### I. Virtual AI Representative (Slide-Over Chatbot)
* **High-Speed Persona Assistant**: Powered by **Groq Llama 3.3 70B** with sub-second response generation.
* **Context-Aware System Prompt**: Evaluates live portfolio details (projects, skills, education, contact info) and responds professionally as the developer's virtual agent.
* **Slide-over Drawer**: Floating chat button in bottom-right corner that slides out an elegant chat interface.

### J. Contact Page (`#contact`)
* **Interactive Message Form**: Direct message dispatcher saving directly to the cloud database with anti-spam rate limiting.
* **Social Hub**: Quick links to LinkedIn, GitHub, Codolio, Medium, and Email.

### K. Printable Resume & CV Exporter (`?print=resume` & `?print=cv`)
* **Automated ATS-Friendly Generator**: Querying `?print=resume` or `?print=cv` strips navbar/footers and renders a clean, professional, print-ready document. Automatically invokes `window.print()` once typography is ready.

---

## 5. Admin Authentication & Console Specification

### Accessing Admin Console:
* **UI Method**: Click the **Lock Icon** in the top navigation bar.
* **URL Method**: Append `#admin` to the site URL.
* **Passcode**: `"arnav1905"` *(Validated with client-side SHA-256 hashing)*.

### Admin Management Panes:
1. **Pane A: Tech Stacks** — Add/Edit/Delete skills, set proficiency percentages (0-100), and create custom categories.
2. **Pane B: Projects** — Add/Edit/Delete projects with image upload, technology tag checkboxes, and an **"AI Suggest Description"** button.
3. **Pane C: Messages Inbox** — Read incoming contact inquiries, toggle unread/read state, delete messages, and use **"Draft AI Reply"** to generate instant email responses.
4. **Pane D: Settings & AI** — Update profile bio, enter your **Groq API Key**, customize social links, and update site metadata.
5. **Pane E: Cloud Sync & Backup**:
   * **`Sync Local Data to Cloud Now ☁️`**: Uploads all local records straight into Supabase Cloud.
   * **`Copy Database Backup`**: Copies the entire portfolio database as a formatted JSON object.
   * **`Restore from Backup JSON`**: Restores and cloud-syncs from any exported backup.
   * **`Clear Local Cache 🗑️`**: Purges browser cache and resets to a clean state.
6. **Pane F: Timeline & Journey** — Add/Edit/Delete education and career entries.
7. **Pane G: Certificates** — Manage verified credentials, issuers, verification links, and certificate images.
8. **Pane H: Hackathons** — Manage competition wins, organizer details, role descriptions, and project links.

---

## 6. AI Engine Configuration (Groq Llama 3.3 70B)

### API Connection Details:
* **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
* **Model**: `llama-3.3-70b-versatile`
* **Free Tier Quota**: 30 requests/minute, ~14,400 requests/day.
* **Headers**: `Authorization: Bearer <GROQ_API_KEY>`, `Content-Type: application/json`
* **Serverless Proxy**: `/api/gemini` handles server-side proxying when keys are stored in Vercel environment variables.

### Groq Key Activation:
1. Obtain free key from **[https://console.groq.com/keys](https://console.groq.com/keys)** (starts with `gsk_...`).
2. Open Admin Panel -> **Settings** -> Paste into **Groq API Key** -> Click **Save Settings**.

---

## 7. Global Cloud Synchronization Engine (`src/data.js`)

* **Cloud-First Architecture**: Supabase PostgreSQL is the primary single source of truth.
* **Offline-First Resilience**: Every query reads from `localStorage` fast-cache for instantaneous rendering, then merges cloud updates in the background.
* **Direct `await` on Cloud Upserts**: Every Admin save/delete action (`saveProject`, `saveTechStack`, `saveTimelineItem`, `saveCertificate`, `saveHackathon`, `saveSettings`) directly awaits the Supabase database write.
* **Auto-Upload on Sync & Load**: If local browser storage has items while cloud tables are empty, `syncWithCloud()` automatically uploads those records to Supabase Cloud.

---

## 8. Step-by-Step Replication Guide for Antigravity

To replicate this exact portfolio on any other device using **Antigravity**:

### Step 1: Initialize Project Directory
Create a new directory and initialize `package.json`:
```bash
mkdir ALL_ME
cd ALL_ME
npm init -y
npm install @supabase/supabase-js
npm install -D vite
```

### Step 2: Feed the Master Replication Prompt
Paste the following prompt into your **Antigravity** chat:

```markdown
I want to build and deploy the complete "ALL_ME" Developer Portfolio SPA based on the PORTFOLIO_MASTER_GUIDE.md specification.

Key Requirements:
1. Framework-less Vanilla ES6+ SPA architecture with Vite build system and Three.js WebGL particle background.
2. Supabase Cloud PostgreSQL database for global synchronization with offline-first localStorage cache.
3. Groq API integration using Meta's `llama-3.3-70b-versatile` model for the AI Representative Chatbot and Recruiter Job-Fit Analyzer.
4. Glassmorphism dark/light design system, ATS-friendly Print/PDF resume generator, and full Admin Console with passcode "arnav1905".
5. Tables: `portfolio_settings`, `portfolio_tech_stacks`, `portfolio_projects`, `portfolio_timeline`, `portfolio_certificates`, `portfolio_hackathons`, `portfolio_blog`, `portfolio_messages`.

Please scaffold the project, set up the database sync layer, connect Groq AI, and configure the responsive UI.
```

### Step 3: Run Local Development Server
```bash
npm run dev
```

### Step 4: Build & Deploy to Vercel
```bash
npm run build
git init
git add .
git commit -m "feat: initial commit of developer portfolio"
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

---

## 9. Environment Variables Reference

| Variable | Location | Description |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Admin Console Settings / Vercel Env | Free API Key from [console.groq.com/keys](https://console.groq.com/keys) |
| `VITE_SUPABASE_URL` | `src/supabase.js` / `.env` | Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | `src/supabase.js` / `.env` | Supabase Public Anonymous API Key |
