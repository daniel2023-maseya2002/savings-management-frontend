Frontend — CreditJambo Web App

React + Tailwind + Framer Motion + Axios + JWT Auth

📌 Overview

Modern web banking interface featuring:

User dashboard & analytics charts

Admin dashboard & control panel

Deposit + withdraw UI flows

Device monitoring + security UI

Landing page with 3D coins & parallax

Theme toggle (Dark / Light)

Toast messages & loading overlay

🧠 Tech Stack
Tech	Purpose
React + Vite	Frontend framework
Tailwind CSS	UI styling
Framer Motion	Smooth animations
Axios + Interceptors	API + Auth refresh
React Router	Navigation
Recharts	Charts & graphs
Toastify	Notifications
📂 Folder Structure
frontend/
 ┣ src/
 ┃ ┣ pages/
 ┃ ┣ components/
 ┃ ┣ context/         # Auth + Theme context
 ┃ ┣ api/axios.js
 ┃ ┣ utils/
 ┃ ┗ styles/
 ┗ vite.config.js

⚙️ Installation
1️⃣ Install packages
cd frontend
npm install

2️⃣ Environment Config

Create .env:

VITE_API_BASE=http://127.0.0.1:8000/api

3️⃣ Run Dev Server
npm run dev

🔐 Authentication

JWT is stored in localStorage

Automatic token refresh

Device ID stored in localStorage

Admin vs User routing logic

🧭 Routes
Route	Role
/	Landing page
/login	Auth
/dashboard	User home
/admin	Admin dashboard
/deposit, /withdraw	User actions
/devices	Device security screen
🎥 UI Preview Features

Parallax gradients

Glass-effect UI

Animated loading overlay

3D floating coin effects

Animated counters & charts

✅ Security Frontend-Side

ProtectedRoute wrapper

AdminRoute guard

JWT refresh queue system

Logout on refresh failure

🧾 Scripts
Command	Action
npm run dev	Start dev server
npm run build	Build for production
npm run preview	Preview build
🙌 Credits

Built by Daniel Maseya Mubu — Kigali, Rwanda
Full-Stack & UX designer