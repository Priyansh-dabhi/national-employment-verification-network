# 📌 MASTER PROMPT — NEVS GOD MODE SCI-FI FRONTEND

We are now building the **God Mode Frontend Dashboard** for the NEVS system.

The backend (nevs-gateway) is already complete and fully operational.

Backend capabilities:

* Fabric v2.5
* CCaaS chaincode
* Multi-peer (peer0 + peer1)
* Service discovery enabled
* Chaos endpoints implemented
* Peer stop/start control
* Sync monitoring endpoint
* Employment CRUD APIs
* Docker-based deployment

We are NOT modifying backend.
We are NOT modifying Fabric.
We are NOT changing architecture.

We are building a **React-based frontend only**.

---

# 🎯 OBJECTIVE

Create a **Tech-Savvy, Sci-Fi, Modern God Dashboard** that:

* Seamlessly connects to backend REST APIs
* Visualizes distributed system behavior
* Shows peer failover
* Shows block height sync
* Shows employment ledger activity
* Looks futuristic but clean
* Uses animations only to improve UX (not gimmicks)
* Is lightweight and responsive

This should feel like:

> A futuristic government command center interface for a national blockchain system.

Not dark hacker UI.
Not childish neon overload.
Not heavy gaming aesthetic.

Modern. Clean. Intelligent. Confident.

---

# 🎨 DESIGN THEME

Theme inspiration:

* Minimal sci-fi UI
* Subtle glowing accents
* Glassmorphism or soft depth
* Smooth transitions
* Intelligent use of motion

Color palette suggestion (you may refine):

* Deep midnight blue / charcoal background
* Cyan or electric blue accents
* Soft purple gradients for highlights
* Green/red only for system health indicators
* White/soft gray text

Must remain professional and academic.

---

# 🧠 UX PRINCIPLES

1. Animations must have purpose.
2. Status changes must animate subtly.
3. No unnecessary motion.
4. Focus on clarity.
5. Dashboard must feel like control center.

---

# 🏗 TECH STACK

Use:

* React (Vite or Next.js — choose best for demo speed)
* Tailwind CSS for styling
* Framer Motion for controlled animations
* Axios for API calls
* Modular component structure
* Clean state management (React hooks is fine)

No overengineering.
No Redux unless truly needed.

---

# 🧩 REQUIRED DASHBOARD SECTIONS

Design the layout before coding.

---

## 1️⃣ Network Status Panel

Displays:

* peer0 status
* peer1 status
* SYNCED / CATCHING_UP / OFFLINE
* Block height per peer
* Network max height

Visual:

* Animated status indicator dot
* Smooth transition when state changes
* Subtle pulsing while catching up

---

## 2️⃣ Peer Control Panel

Buttons:

* Stop peer0
* Start peer0
* Stop peer1
* Start peer1

UX:

* Confirmation modal before stop
* Disabled button when peer already offline
* Loading animation during action
* Toast notifications for success/failure

---

## 3️⃣ Employment Ledger Viewer

Display:

* Table of employment records
* Search by ID
* Real-time refresh button
* Expand row for detailed JSON view
* Show transaction ID if available

Make table elegant and readable.

---

## 4️⃣ Create Employment Form

Form with:

* Employee ID
* Employer Name
* Role
* Status (if applicable)

Submission:

* Loading animation
* Success animation
* Display TxID
* Auto refresh table

---

## 5️⃣ System Activity Panel

Optional but powerful:

* Recent transactions list
* Sync events
* Peer status change logs

Scrolling minimal log feed.

---

# 🔌 BACKEND API INTEGRATION

Use these endpoints:

* GET `/api/godmode/network/status`
* GET `/api/godmode/peers/sync-status`
* POST `/api/godmode/peer/stop`
* POST `/api/godmode/peer/start`
* GET `/api/employment`
* GET `/api/employment/employee/:id`
* POST `/api/employment`

Do NOT invent endpoints.
If something missing — ask.

---

# ⚠️ CRITICAL CONSTRAINTS

* Do NOT assume backend responses.
* Use exact response format.
* If response format unclear — ask.
* Do NOT hardcode peer states.
* All status must be dynamic.
* Poll sync status every 3–5 seconds.
* Use graceful loading states.

---

# 🚦 DEVELOPMENT PHASES

Proceed in phases.

---

## PHASE 1 — UI & Architecture Plan

Before coding:

1. Propose folder structure.
2. Propose component breakdown.
3. Explain state management strategy.
4. Explain polling strategy.
5. Explain animation strategy.
6. Show rough layout hierarchy.

STOP and wait for approval.

---

## PHASE 2 — Base Layout Implementation

* Implement base layout
* Implement theme
* Implement panels with dummy data
* No API calls yet

---

## PHASE 3 — API Integration

* Connect real endpoints
* Add polling
* Add loading states
* Add error handling

---

## PHASE 4 — Animation & Polish

* Add subtle transitions
* Add motion only where useful
* Optimize performance
* Ensure responsiveness

---

# 🎬 DEMO EXPERIENCE GOAL

When professor sees this:

It should feel like:

* Watching a real distributed system
* Observing failover live
* Seeing sync progress animate
* Seeing ledger data update instantly

It must look like:

> A national-level blockchain command center.

---

# 🛑 NO HALLUCINATION POLICY

If:

* Backend response format unknown
* Endpoint missing
* Data shape unclear

You must ask before proceeding.

Do not guess.

---

# 🎯 START WITH

## PHASE 1 — UI & ARCHITECTURE PLAN

Do not write implementation code yet.
Wait for my approval before coding.