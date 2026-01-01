# Job Application Tracker

**Job Application Tracker** is a modern application designed to make the job application process clearer, more organized, and easier to manage.

Its goal is to eliminate scattered notes, forgotten follow-ups, and the constant question of *“where was I in this process?”* by bringing everything into a single, coherent flow.

This project is built as a **demo / portfolio application**, with a strong focus on product thinking and user experience.

---

## 🎯 Why This Application Exists

Managing job applications often turns into a mental burden:

- Which companies did I apply to?
- Did I already follow up?
- Was there an interview scheduled?
- What was discussed last time?
- Which stage am I currently in?

Job Application Tracker exists to answer all of these questions **at a glance**, in one place.

---

## 🧠 What Does It Provide?

### 📌 Visual Clarity
Applications are organized into clear stages and displayed on a board.

This allows users to:
- instantly understand the overall state of their job search
- see where most applications are concentrated
- identify bottlenecks in the process

---

### 🗂️ Structure and Organization
Each application keeps all relevant information together:

- company
- role
- notes
- follow-up status

This removes fragmentation and replaces it with a single source of truth.

---

### 🔄 Active Process Management
Applications are not static entries.

- They can be moved between stages
- The process becomes dynamic instead of archival

This encourages users to **actively manage** their job search rather than passively track it.

---

### 📊 Clear Overview of Progress
The stats view helps users understand the health of their process.

- which stages dominate the pipeline
- how progress evolves over time
- where attention is needed

Decisions are supported visually, not based on guesswork.

---

### 🤖 Faster Interaction Through Commands
The application includes a command-based interaction layer to speed up frequent actions.

- Less clicking
- More flow
- Actions without breaking focus

Command usage and examples are intentionally explained **inside the application UI**, keeping this document product-focused.

---

## 📱 How It Helps in Daily Use

- Reduces the mental load of remembering details
- Prevents missed follow-ups
- Makes progress (or lack of it) visible
- Creates a sense of control over the process

The application is designed to support clarity, not overwhelm.

---

## 🖼️ Application Screenshots

The following images showcase the application interface and overall structure.

![Board View](/src/assets/dashboard.jpeg)
![Add Job](/src/assets/addjobgenerate.jpeg)  
![Stats View](/src/assets/stasview.jpeg)  
![Agent Panel](/src/assets/agentoutput.jpeg)

---

## 🏗️ Overall Structure

The diagram below illustrates the high-level structure of the application.

![Application Architecture](assets/architecture.png)

The structure is intentionally kept:
- simple
- readable
- easy to reason about

This supports long-term clarity and maintainability.

---

## 🚀 Running the Application

```bash
npm install
npm run dev

---

## 🚀 Running the Application

http://localhost:5173

---

## For The Local agent:

cd server
npm install
npm run dev
node ./server/agentServer.mjs

##typescript modul:

npm install -D @types/react @types/react-dom

📌 Notes

This project is intended as a demo / portfolio showcase
No real user data is involved

The primary focus is on experience, clarity, and product quality
