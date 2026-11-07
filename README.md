# ZIAS – Student Management System

ZIAS is a full-stack Student Management System built using **Django, Django REST Framework, React, and PostgreSQL**. It provides a centralized platform for managing students, mentors, batches, attendance, and academic reviews through role-based dashboards.

## 🌐 Live Application

| Component | Deployed URL |
|---|---|
| Frontend | https://zias-frontend.onrender.com |
| Backend | https://zias-backend.onrender.com |
| Database | Supabase PostgreSQL |

**Frontend:** [Open ZIAS Application](https://zias-frontend.onrender.com)

**Backend:** [Open ZIAS Backend](https://zias-backend.onrender.com)

## 🚀 Features

### Backend
- User authentication using JWT
- Student management
- Attendance tracking
- Mentor management
- Batch management
- Academic review management
- Role-based access control
- RESTful APIs using Django REST Framework
- PostgreSQL database integration

### Frontend
- React.js with Vite
- Role-based dashboards
- Admin, Mentor, Student, Reviewer, and Accounts interfaces
- API integration using Axios
- Responsive user interface
- Tailwind CSS styling

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | Tailwind CSS |
| API Integration | Axios |
| Backend | Python, Django |
| API Framework | Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| Database Hosting | Supabase |
| Deployment | Render |
| Version Control | Git, GitHub |

## 📂 Project Structure

```text
ZIAS/
│
├── zias_backend/
│   ├── accounts/
│   ├── manage.py
│   └── requirements.txt
│
├── zias-frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Environment Configuration

### Frontend Environment Variables

Configure the following environment variable in your Render frontend service:

```env
VITE_API_BASE_URL=https://zias-backend.onrender.com
```

### Backend Environment Variables

Configure the required environment variables in your Render backend service according to your Django settings.

Example:

```env
SECRET_KEY=your_secret_key
DEBUG=False
DATABASE_URL=your_supabase_database_connection_string
```

**Important:**
- Never commit actual `.env` files or database credentials.
- Keep secret keys and database connection strings private.
- Set production environment variables through the Render dashboard.
- Configure Django `ALLOWED_HOSTS`, CORS, and CSRF trusted origins for your deployed domains.

## ☁️ Deployment Architecture

ZIAS uses the following deployment architecture:

```text
              Users
                |
                v
       React + Vite Frontend
                |
                | HTTPS API Requests
                v
        Django REST Backend
                |
                | PostgreSQL Connection
                v
        Supabase PostgreSQL
```

### Hosting Platforms

- **Frontend Hosting:** Render
- **Backend Hosting:** Render
- **Database Hosting:** Supabase PostgreSQL

## 🔒 Security Improvements

- Removed sensitive `.env` files from Git tracking.
- Added `.gitignore` rules for sensitive and generated files.
- Configured secret keys through environment variables.
- Configured production debug settings.
- Rotated exposed credentials.
- Kept environment example files for configuration guidance.

## 👩‍💻 Developer

**Fathimath Sulthana**

Project: ZIAS – Student Management System

## 📌 Project Status

- Backend deployed
- Frontend deployed
- PostgreSQL database integrated
- Role-based dashboards implemented
- JWT authentication configured
- GitHub repository security improvements completed

---

**ZIAS – Simplifying Student and Academic Management.**