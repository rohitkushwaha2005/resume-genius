🧠 AI Resume Builder – Full Stack Web Application

A modern, full-stack AI-powered Resume Builder that helps users create, analyze, and optimize professional resumes.
The platform goes beyond basic resume generation by offering resume scoring, job-specific optimization, smart feedback, and dynamic UI, making it suitable for real-world use.

🚀 Features
🔐 Authentication

Secure user signup and login

Session persistence

Protected routes for authenticated users

Logout functionality

📄 Resume Builder

Create and manage multiple resumes

Structured sections:

Personal Information

Education

Work Experience

Projects

Skills

Edit, update, and delete resumes

🤖 AI-Powered Capabilities

Professional resume summary generation

Experience and project description enhancement

Role-based skill suggestions

Resume analysis with ATS score and feedback

Smart content warnings (weak words, repetition, length issues)

🎯 Job Description Optimizer

Paste a job description

Automatically tailor resume content to match the role

Improves keyword relevance and job alignment

📊 Resume Scoring & Feedback

ATS compatibility score (0–100)

Strengths and weaknesses analysis

Actionable improvement suggestions

🎨 UI & UX Enhancements

Light and Dark mode

Font switcher for resume preview

Step-by-step progress indicator

Responsive and modern design

Clean, ATS-friendly resume layout

📥 Export

Download resume as a professionally formatted PDF

🛠 Tech Stack
Frontend

React (Vite)

Tailwind CSS

React Router

Context API

Backend

Node.js

Express.js

Database & Auth

Supabase (Authentication & Data Storage)

🧩 Project Structure
src/
 ├── components/
 ├── pages/
 │    ├── Login.jsx
 │    ├── Signup.jsx
 │    ├── Dashboard.jsx
 │    ├── ResumeBuilder.jsx
 ├── context/
 │    ├── AuthContext.jsx
 ├── services/
 ├── utils/
 ├── App.jsx

server/
 ├── routes/
 ├── controllers/
 ├── services/
 ├── index.js

🔄 Application Flow
Landing Page
   ↓
Signup / Login
   ↓
Dashboard
   ↓
Create or Edit Resume
   ↓
AI Enhancement & Optimization
   ↓
Resume Preview
   ↓
Download PDF

🧠 Why This Project Is Different

Not just resume creation, but resume analysis and improvement

Job-specific resume customization

Real-time feedback and suggestions

Designed like a real SaaS product, not a college demo

Scalable and production-ready architecture

💼 Use Cases

Students and freshers creating professional resumes

Job seekers optimizing resumes for specific roles

Portfolio project for full-stack and AI-based applications

📦 Installation & Setup
# Clone the repository
git clone <repository-url>

# Frontend
cd client
npm install
npm run dev

# Backend
cd server
npm install
npm start


Add environment variables for authentication and database configuration before running the project.

📈 Future Improvements

Resume version history

Public shareable resume links

Multi-language resume support

Cover letter generation

Recruiter feedback mode

👤 Author

Rohit Kumar Kushwaha
Bachelor’s in Computer Science
Full Stack Developer
