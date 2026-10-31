# CodeWave Daily 🌊⚡

> **Ride the wave. Win the day.**

CodeWave Daily is a high-performance, local-first schedule and routine planner designed for student developers and focused learners. It combines intuitive time-blocking, daily core missions, an intelligent "I'm starting late" schedule rebuilder, gaming distraction guardrails with reward timers, service worker reminders, and an integrated Gemini AI Coach.

---

## 🎯 What the App Does

CodeWave Daily helps you build and stick to a balanced daily rhythm without feeling trapped in rigid calendars:
- **Full schedule control**: Shape your blocks, durations, categories, and repeat rules.
- **Student-focused rhythm**: Built-in defaults for lectures, deep coding sprints, study sessions, sports/training, meals, rest, and downtime.
- **Distraction guardrails**: The CODM gaming lock protects your focus hours until your Study and Coding missions are completed. Once unlocked, an audio-timed session timer keeps gaming under control.
- **Resilience when plans derail**: Tap "I'm starting late" to dynamically restructure the rest of your day from the current moment, trimming low-priority items while strictly preserving your target sleep bedtime.
- **Local-first privacy**: Your routines, tasks, and history stay on your device in LocalStorage. Only explicit AI Coach interactions send schedule data to Google Gemini.

---

## ✨ Features

### 1. Dynamic Schedule Blocks
- **Add & Edit with Flexibility**: Customize title, start/end time, duration, notes, category, emoji icon, and priority (High / Medium / Low).
- **Time Shift Options**: When adjusting a block's timing, choose between *"Push following blocks later"* or *"Only change this block"*.
- **Drag & Drop Reordering**: Automatically re-calculates sequential times while preserving durations.
- **Overlap Detection & Auto-Fix**: Visual warning banner with one-click sequential push or dismiss.
- **Repeat Rules**: Today only, Every day, Weekdays, Weekends, or Custom days (Mon/Wed/Fri). Edit prompts for "Just today" vs "All future days".
- **Custom Categories**: Add, edit, recolor, and delete categories with safe block re-assignment.

### 2. Student Routine & Daily 3 Missions
- **Tailored Category System**: Study 📚, Coding 💻, Basketball 🏀, CODM 🎮, Meals 🥪, Rest 🛌, and Lectures 🎓.
- **Core Daily 3 Score**: Track your daily progress across:
  1. *Study one topic*
  2. *Make progress on one coding task*
  3. *Move / train*
- **Manual Ticking**: Easily check off daily missions manually or let completed schedule tasks advance your score.

### 3. CODM Lock & Focused Reward Timer
- **Anti-Distraction Lock**: Gaming blocks show as locked until both the Study and Coding missions have been completed for today.
- **Reward Session Countdown**: Once unlocked, launch a circular countdown timer with pause/resume and a 3-tone Web Audio chime when your gaming window expires.
- **Configurable in Preferences**: Turn the guardrail on/off or configure the active distraction window.

### 4. "I'm Starting Late" Schedule Rebuilder
- Running behind schedule? Instead of abandoning your day, tap **"I'm starting late"**.
- CodeWave Daily scans the remaining hours between now and your configured **Target Bedtime**.
- Dropping low-priority blocks and proportionally compressing medium/high-priority blocks ensures you get key work done while **never pushing bedtime past your sleep target**.
- Includes an interactive preview before applying and a 10-second Undo snackbar.

### 5. Scheduled Block Reminders & PWA Support
- **Service Worker & Notifications API**: Notifies you N minutes before each block (customizable per category, e.g. 10m before Coding, 15m before Lectures).
- **Test Notification**: Verify system banner alerts with one tap in Preferences.
- **PWA Ready**: Installable to desktop, iOS, or Android with offline service worker, Web App Manifest, and adaptive icons.

### 6. Weekly Stats & Analytics
- **Mission Streak**: Tracks consecutive days achieving your daily 3 mission goal.
- **Coding Hours**: Aggregates total dedicated coding time for the current week.
- **Weekly Bar Chart**: Visual Monday-Sunday breakdown of focus hours vs planned blocks.
- **Category Allocation**: Inspect your weekly time split across Study, Coding, Sport, and Rest.

### 7. Task Management & Carry Over
- **Checklists inside Blocks**: Add granular subtasks to each schedule block.
- **End-of-Day Carry Over**: Move unfinished tasks to tomorrow, reschedule them, move them to Inbox, or discard.
- **Unscheduled Inbox**: Capture incoming ideas and drag or schedule them into blocks whenever ready.
- **Day Templates**: Save routines as reusable templates (e.g., "Lecture day", "Home day", "Exam week") and set default templates per weekday.

### 8. Gemini AI Schedule Coach
- Conversational schedule advisor powered by the `@google/genai` TypeScript SDK.
- Can create, move, update, and remove blocks or tasks (e.g. *"Add a 30m reading block after dinner"* or *"Clear basketball this Sunday"*).
- Always presents an interactive preview with actions breakdown before applying changes, with a 10-second Undo window.
- Protected by rate limiting (10 requests per 10 minutes per IP) and a 500-character input cap.

---

## 📸 Screenshots

| Schedule Timeline & CODM Guardrail | "I'm Starting Late" Rebuilder | Weekly Stats & Streak |
| :---: | :---: | :---: |
| *[Screenshot Placeholder: Timeline & Missions]* | *[Screenshot Placeholder: Start Late Preview]* | *[Screenshot Placeholder: Weekly Bar Chart]* |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or pnpm

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/codewave-daily.git
   cd codewave-daily
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API Key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   PORT=3000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 🌐 How to Deploy on Render

CodeWave Daily runs a full-stack Node.js + Express backend that serves the Vite production build and proxies secure AI Coach queries.

### Deployment Guide:
1. Push your repository to GitHub or GitLab.
2. Sign in to your [Render Dashboard](https://render.com) and click **New + > Web Service**.
3. Connect your repository.
4. Configure the service settings:
   - **Name**: `codewave-daily`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run start
     ```
   - **Plan**: Free or Starter
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will install dependencies, build the client bundle via Vite, and start `server.ts`.

---

## 🔒 Privacy & Data Boundary

- **Local-first**: All routines, custom categories, subtasks, and preferences reside solely in the user's browser storage (`codewave_*`).
- **Data migration**: Existing legacy storage keys are automatically migrated on first launch.
- **AI Coach calls**: Only user chat prompts and today's schedule structure are transmitted to Google Gemini to formulate schedule suggestions. No private keys or device identifiers are stored on servers.
- **Telemetry-free**: Zero third-party trackers, beacons, or marketing cookies.

---

## 📄 License

Apache-2.0 License.
