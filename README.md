# ZIAS - Student Management System

## 📌 Project Overview
ZIAS is a full-stack Student Management System built using Django (backend) and React (frontend).  
It helps manage students, attendance, mentors, batches, and reviews in a structured way.

---

## 🚀 Features

### Backend
- User Authentication (JWT)
- Student Management
- Attendance Tracking
- Mentor & Batch Management
- Role-based Access Control
- REST API using Django REST Framework

### Frontend
- React + Vite UI
- Dashboard for Admin / Mentor / Student
- API integration using Axios
- Responsive design using Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios

### Backend
- Django
- Django REST Framework
- PostgreSQL
- Simple JWT
- Celery (if used)

---

## 📂 Project Structure

```
ZIAS/
│
├── zias_backend/
├── zias-frontend/
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 🔹 Backend Setup

```bash
cd zias_backend
pip install -r requirements.txt
python manage.py runserver
```

Backend runs on:
```
http://127.0.0.1:8000/
```

---

### 🔹 Frontend Setup

```bash
cd zias-frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173/
```

---

## 🔐 Environment Variables

### Backend `.env`

```
SECRET_KEY=your_secret_key
DEBUG=True
DB_NAME=your_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### Frontend `.env`

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## 🔒 Security Improvements Done

- Removed `.env` from GitHub
- Added `.gitignore`
- Secret keys moved to environment variables
- DEBUG mode handled via env
- Credentials rotated

---

## 👨‍💻 Developer

- Name: Sulthana
- Project: ZIAS Student Management System

---

## 📌 Status

✔ Backend working  
✔ Frontend working  
✔ GitHub cleaned  
✔ Environment secured  