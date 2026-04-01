<img width="3840" height="1080" alt="image" src="https://github.com/user-attachments/assets/1143ecdf-ff97-4991-b1d4-a8ed1b470fa0" /># LinkVault - Secure Link Management System

LinkVault is a full-stack web application that allows users to securely organize, store, and manage their bookmarks and links in categorized collections. The application provides a clean, intuitive interface with cloud synchronization, dark/light mode support, and data import/export capabilities.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Deployment](#deployment)
- [Installation & Setup](#installation--setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**: Secure login with email/password or Google OAuth via Firebase Authentication
- **Category Management**: Create, rename, and delete categories to organize links
- **Link Management**: Add, edit, and delete links within categories
- **Cloud Sync**: All data is stored in PostgreSQL database with real-time synchronization
- **Offline Support**: Local storage fallback when offline
- **Search Functionality**: Real-time search across all links
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Data Import/Export**: Backup and restore data using JSON format
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Multi-user Support**: Each user has their own isolated vault

## Tech Stack

### Frontend
- **HTML5/CSS3**: Structure and styling with custom CSS (no frameworks)
- **Vanilla JavaScript**: Pure JavaScript for core functionality
- **Firebase SDK**: Authentication and token management
- **Font Awesome**: Icon library for UI elements

### Backend
- **FastAPI**: Modern Python web framework for REST API
- **Python 3.9+**: Core programming language
- **PostgreSQL**: Primary database for production
- **asyncpg**: Asynchronous PostgreSQL driver
- **Firebase Admin SDK**: Server-side token verification
- **Pydantic**: Data validation and settings management

### Authentication
- **Firebase Authentication**: Handles user authentication, token generation, and verification
- **JWT Tokens**: Bearer tokens for API authorization

### Deployment
- **Backend**: Deployed on Railway.app (production) or Render
- **Frontend**: Deployed on Vercel
- **Database**: PostgreSQL managed by Railway/Render

### Development Tools
- **Uvicorn**: ASGI server for FastAPI
- **Gunicorn**: WSGI server for production
- **Python-dotenv**: Environment variable management
- **Docker**: Containerization support

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Frontend (Vercel)                                   │   │
│  │  - HTML/CSS/JS                                       │   │
│  │  - Firebase SDK (Client-side)                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Authentication                   │
│  - User sign-in/sign-up                                      │
│  - JWT token generation                                      │
│  - OAuth providers (Google)                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Railway)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  FastAPI Application                                 │   │
│  │  - Token verification (Firebase Admin)               │   │
│  │  - CRUD operations for categories/links              │   │
│  │  - CORS configuration for frontend                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  - users table                                               │
│  - categories table                                          │
│  - links table                                               │
└─────────────────────────────────────────────────────────────┘
```

## Deployment

### Backend (Railway.app)
- URL: `https://link-vault.up.railway.app`
- Platform: Railway.app with automatic deployments from GitHub
- Database: Managed PostgreSQL database
- Configuration: `railway.json` for deployment settings

### Frontend (Vercel)
- URL: `https://l-vault.vercel.app`
- Platform: Vercel with automatic deployments from GitHub
- Build Configuration: `vercel.json` for routing and build settings

## Installation & Setup

### Prerequisites
- Python 3.9 or higher
- Node.js (for local frontend development)
- PostgreSQL (for local development)
- Firebase account (for authentication)
- Git

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/linkvault.git
cd linkvault
```

2. Navigate to backend directory:
```bash
cd backend
```

3. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables:
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/linkvault
FIREBASE_SERVICE_ACCOUNT_JSON=path/to/serviceAccountKey.json
SKIP_FIREBASE=false
```

6. Initialize database:
```bash
psql -U postgres -f init.sql
```

7. Run the development server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Update Firebase configuration in `src/js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

3. Update API URL in `src/js/api-client.js`:
```javascript
this.baseUrl = 'http://localhost:8000';  // Development
// this.baseUrl = 'https://link-vault.up.railway.app';  // Production
```

4. Serve the frontend locally:
- Using Python: `python -m http.server 3000`
- Using VS Code Live Server extension
- Using any static file server

5. Access the application at `http://localhost:3000`

## Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Path to Firebase service account JSON file | `./serviceAccountKey.json` |
| `SKIP_FIREBASE` | Skip Firebase verification for development | `true` or `false` |

### Frontend (firebase-config.js)
| Variable | Description |
|----------|-------------|
| `apiKey` | Firebase API key |
| `authDomain` | Firebase authentication domain |
| `projectId` | Firebase project identifier |
| `storageBucket` | Firebase storage bucket |
| `messagingSenderId` | Firebase messaging sender ID |
| `appId` | Firebase application ID |

## API Documentation

### Authentication Endpoints

#### POST `/api/auth/verify`
Verify Firebase token
```json
{
  "token": "firebase_jwt_token"
}
```

### Category Endpoints

#### GET `/api/categories/`
Get all categories for authenticated user

#### POST `/api/categories/`
Create a new category
```json
{
  "name": "Work",
  "links": []
}
```

#### PUT `/api/categories/{category_name}`
Rename a category
```json
{
  "name": "New Category Name"
}
```

#### DELETE `/api/categories/{category_name}`
Delete a category and all its links

### Link Endpoints

#### POST `/api/categories/{category_name}/links`
Add a link to a category
```json
{
  "title": "Google",
  "url": "https://google.com"
}
```

#### DELETE `/api/categories/{category_name}/links/{link_title}`
Delete a link from a category

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(128) | Firebase user ID (Primary Key) |
| email | VARCHAR(255) | User email address |
| created_at | TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Categories Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| user_id | VARCHAR(128) | Foreign key to users |
| name | VARCHAR(100) | Category name |
| position | INTEGER | Display order |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Links Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary Key |
| category_id | INTEGER | Foreign key to categories |
| title | VARCHAR(255) | Link title |
| url | TEXT | Link URL |
| position | INTEGER | Display order within category |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Project Structure

```
LinkVault/
├── backend/                       # FastAPI backend application
│   ├── app/                      # Main application package
│   │   ├── routes/               # API route handlers
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── categories.py    # Category CRUD operations
│   │   │   └── links.py         # Link management endpoints
│   │   ├── __init__.py          # Package initializer
│   │   ├── database.py          # PostgreSQL connection and queries
│   │   ├── firebase_admin.py    # Firebase Admin SDK integration
│   │   ├── main.py              # FastAPI application entry point
│   │   └── models.py            # Pydantic data models
│   ├── Dockerfile/              # Docker container configuration
│   │   └── dockerfile
│   ├── init.sql                 # Database initialization script
│   ├── render.yaml              # Render.com deployment config
│   ├── requirements.txt         # Python dependencies
│   └── serviceAccountKey.json   # Firebase service account (not in repo)
├── frontend/                     # Static frontend application
│   ├── public/                  # Public assets
│   │   ├── images/              # Image assets
│   │   │   ├── google-icon.png # Google login icon
│   │   │   └── vault.png        # Application favicon
│   │   ├── src/                # Source files
│   │   │   └── js/             # JavaScript modules
│   │   │       ├── api-client.js      # API communication layer
│   │   │       ├── auth.js            # Authentication logic
│   │   │       ├── firebase-config.js # Firebase SDK configuration
│   │   │       ├── homepage.js        # Dashboard functionality
│   │   │       └── migration.js       # Data migration utility
│   │   ├── homepage.html        # Main dashboard page
│   │   ├── index.html           # Login page
│   │   ├── style.css            # Global styles
│   │   └── test_firebase.html   # Firebase test page
│   ├── package.json             # NPM configuration
│   └── vercel.json              # Vercel deployment config
├── docker-compose.yml           # Docker Compose configuration
├── railway.json                 # Railway.app deployment config
├── README.md                    # Project documentation
├── requirements.txt             # Root Python dependencies
└──runtime.txt                  # Python runtime version
```

## Screenshots

[Screenshots to be added here]
- Login Page
  
- Dashboard with Categories
  
- Dark Mode View

- Link Management Interface
  
- Import/Export Modal

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use meaningful commit messages
- Test changes locally before submitting PR
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Contact the maintainers
- Check existing documentation

---

**Built with FastAPI, Firebase, and PostgreSQL**
