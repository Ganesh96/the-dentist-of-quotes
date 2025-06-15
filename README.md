# The Dentist of Quotes

**"The Dentist of Quotes"** is a full-stack web application designed to provide users with a daily dose of inspiration. It features a React and TypeScript frontend, a Python FastAPI backend, and leverages Supabase for authentication and database management. The entire application is configured for seamless deployment on Vercel.

---

## Features

- **Daily Personalized Quotes**: Receive a new quote every day, tailored to your selected interests.
- **User Authentication**: Secure sign-up and login functionality using Supabase Auth, including OAuth providers like Google and GitHub.
- **Interest Management**: Users can select and save their interests to customize the types of quotes they receive.
- **Personal Quote Collection**: Add, view, and manage your own private collection of quotes.
- **Responsive UI**: A clean and modern user interface built with modular CSS, designed to work on all devices.

---

## Tech Stack

### Frontend:

- React (v19) with TypeScript  
- Vite for fast development and bundling  
- React Router (v6) for client-side routing  
- Supabase Client JS for interacting with the Supabase backend  

### Backend:

- FastAPI for creating a high-performance Python API  
- Supabase Python Client for server-side interactions  

### Database & Auth:

- Supabase (PostgreSQL)  

### Deployment:

- Vercel  

---

## Project Structure

```
the-dentist-of-quotes/
│
├── backend/          # FastAPI application
│   ├── main.py
│   └── requirements.txt
│
├── frontend/         # React application
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
├── vercel.json       # Vercel deployment configuration
└── README.md         # This file
```

---

## Setup and Installation

### Prerequisites

- Node.js (v18 or newer recommended)  
- Python (v3.8 or newer)  
- A Supabase account  

---

## Environment Variables

Before running the application, you need to set up your environment variables.

### Supabase Setup:

1. Create a new project in your Supabase dashboard.
2. Go to **Project Settings > API**. You will find your Project URL and anon public key here.
3. You will also need the `service_role` key for the backend. **Keep this secret!**

### Frontend `.env` file:

In the `frontend` directory, create a file named `.env`:

```
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Backend Environment:

When running the backend locally, you can create a `.env` file in the `backend` directory. When deploying to Vercel, you will set these in the project's environment variable settings.

```
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

---

## Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install the required packages
pip install -r requirements.txt

# Run the FastAPI development server
uvicorn main:app --reload
```

The backend API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).

---

## Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install the dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend application will be available at [http://localhost:5173](http://localhost:5173) (or another port if 5173 is busy).

---

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file in the root directory contains the necessary build configurations and rewrite rules to serve the React app and the FastAPI backend from a single domain.

### To deploy:

1. Push your code to a Git repository (GitHub, GitLab, etc.).
2. Import the repository into your [Vercel dashboard](https://vercel.com/).
3. Vercel should automatically detect the monorepo structure. Configure the root directory for the frontend if needed.
4. Add your Supabase environment variables in the Vercel project settings.
5. **Deploy!**
