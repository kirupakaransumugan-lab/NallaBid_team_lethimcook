## 2. Run the backend

```powershell
cd NallaBid\backend
python -m venv venv
.\venv\Scripts\Activate.ps1          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env               # then edit DB_PASSWORD and JWT_SECRET_KEY
python -m alembic upgrade head       # only if you did NOT run the SQL script
python seed.py                       # optional: demo data for the viva

uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000/api
- Swagger: http://127.0.0.1:8000/docs

## 3. Run the frontend

Bootstrap CSS, Bootstrap JS and Bootstrap Icons are loaded from CDN links in
`frontend/index.html`, so you need internet the first time you open the app.


```powershell
cd NallaBid\frontend
npm install
npm run dev
```

Open http://localhost:5173









# 3. NallaBid Technology Stack

## Backend

-   Python
-   FastAPI
-   Uvicorn
-   Pydantic
-   Pydantic Settings
-   SQLAlchemy
-   MySQL
-   PyMySQL
-   Alembic
-   OAuth2 password flow
-   JWT Bearer authentication
-   Argon2 password hashing
-   Python CSV processing
-   Pandas
-   ReportLab

## Frontend

-   React
-   Vite
-   React Router
-   Bootstrap
-   Bootstrap Icons
-   Inter font
-   CSS
-   JavaScript

Bootstrap and Bootstrap Icons are installed locally through npm.

Do not add Bootstrap CDN links unless the team explicitly decides to
change this setup.

------------------------------------------------------------------------

# 4. Repository Structure

Current high-level structure:

``` text
NallaBid/
│
├── Backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── security/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── venv/
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── sidebar-card.png
│   │   │
│   │   ├── components/
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── buyer/
│   │   │   ├── supplier/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── services/
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── package.json
│   └── index.html
│
├── .gitignore
└── README.md
```

The exact files may grow as features are implemented.

------------------------------------------------------------------------

# 5. Backend Setup

Open a terminal in:

``` text
NallaBid/Backend
```

## Create virtual environment

If `venv` is not already present:

``` bash
python -m venv venv
```

## Activate on Windows PowerShell

``` powershell
.\venv\Scripts\Activate.ps1
```

If activation is blocked by PowerShell policy, use the appropriate local
Python/terminal configuration rather than committing the virtual
environment.

You should see:

``` text
(venv)
```

at the beginning of the terminal.

------------------------------------------------------------------------

# 6. Backend Packages

The project uses the packages defined in:

``` text
Backend/requirements.txt
```

Install them with:

``` bash
pip install -r requirements.txt
```

Important backend packages include:

``` text
fastapi
uvicorn
sqlalchemy
pymysql
pydantic
pydantic-settings
alembic
python-jose
argon2-cffi
python-multipart
pandas
reportlab
```

The actual `requirements.txt` in the repository is the source of truth.
Do not create a second package list if the repository already contains
one.

------------------------------------------------------------------------

# 7. MySQL Setup

NallaBid uses MySQL.

Create the project database in MySQL.

Example:

``` sql
CREATE DATABASE nallabid_db;
```

Create/use the project database user according to the team's local
setup.

Do not commit database passwords to Git.

The backend database configuration uses environment variables.

Example `.env` structure:

``` env
DB_USER=nallabid_user
DB_PASSWORD=your_local_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nallabid_db

JWT_SECRET_KEY=your_long_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Use the team's actual configuration values locally.

**Never commit the real `.env` file.**

------------------------------------------------------------------------

# 8. Backend Database Rules

Do not change the project to SQLite.

The project uses:

``` text
FastAPI
    ↓
SQLAlchemy
    ↓
PyMySQL
    ↓
MySQL
```

Database records must use stable backend/database-generated IDs.

Use:

-   Primary keys
-   Foreign keys
-   Relationship tables where required
-   Database uniqueness constraints where appropriate

Do not use:

-   Names as database identifiers
-   Email addresses as database identifiers
-   Array indexes
-   UI positions

------------------------------------------------------------------------

# 9. Backend Authentication

NallaBid uses:

``` text
OAuth2 Password Flow
        ↓
JWT Bearer Token
        ↓
Protected FastAPI endpoints
```

Passwords are hashed with:

``` text
Argon2
```

Never store plain-text passwords.

The frontend must not be treated as the security boundary. Protected
backend endpoints must independently validate authentication and
authorization.

------------------------------------------------------------------------

# 10. Run Backend

From:

``` text
NallaBid/Backend
```

with the virtual environment activated:

``` bash
uvicorn app.main:app --reload
```

Backend:

``` text
http://127.0.0.1:8000
```

Swagger:

``` text
http://127.0.0.1:8000/docs
```

The API uses the project `/api` prefix.

Example:

``` text
/api/
/api/health
```

------------------------------------------------------------------------

# 11. Frontend Setup

Open another terminal in:

``` text
NallaBid/frontend
```

Install dependencies:

``` bash
npm install
```

Important frontend packages:

``` text
react
react-dom
react-router-dom
bootstrap
bootstrap-icons
```

Bootstrap and Bootstrap Icons should be installed locally through npm.

Do not install a second UI framework unless the team agrees.

------------------------------------------------------------------------

# 12. Frontend Run

From:

``` text
NallaBid/frontend
```

run:

``` bash
npm run dev
```

The Vite development server normally runs at:

``` text
http://localhost:5173
```

------------------------------------------------------------------------

# 13. Shared Frontend Template

The shared NallaBid shell is already implemented.

The important shared component is:

``` text
frontend/src/components/Navbar.jsx
```

It contains:

-   Topbar
-   Search box
-   Notifications
-   Messages
-   Help icon
-   User profile area
-   Sidebar
-   Home
-   My RFQs
-   Create RFQ
-   Quotations
-   Reports
-   Suppliers
-   Profile

The responsive styling is in:

``` text
frontend/src/App.css
```

The shared shell is mobile-first and expands for tablet and desktop
screens.

------------------------------------------------------------------------

# 14. Shared Asset

The promotional sidebar image belongs here:

``` text
frontend/src/assets/sidebar-card.png
```

Do not move or rename it without updating `Navbar.jsx`.

------------------------------------------------------------------------

# 15. Team Member Work Area

The teammate working on the Supplier side should mainly work inside:

``` text
frontend/src/pages/supplier/
```

Their planned areas include:

-   Supplier dashboard
-   RFQ opportunities
-   RFQ details
-   Quotation forms
-   Supplier quotation management
-   CSV supplier catalogue functionality
-   Reports

Backend work should be placed in the existing backend architecture:

``` text
Backend/app/models/
Backend/app/routers/
Backend/app/schemas/
Backend/app/services/
```

Do not create a completely separate FastAPI application.

------------------------------------------------------------------------

# 16. CSV Work

CSV functionality uses Python CSV processing.

Use it for the required validated CSV import functionality, such as
supplier catalogue/import data.

CSV processing must validate:

-   Required columns
-   Data types
-   Invalid rows
-   Duplicate/conflicting records
-   Safe data before database insertion

Do not directly trust uploaded CSV contents.

------------------------------------------------------------------------

# 17. Reports

NallaBid requires at least three useful reports.

The project uses:

``` text
Pandas
ReportLab
```

Reports should be generated from current authorized application data.

Planned report examples include:

1.  RFQ Comparison Report
2.  Supplier Eligibility / Performance Report
3.  Awarded / Completed RFQ Summary

Reports must respect the logged-in user's authorization.

PDF reports should have professional headers and readable tables.

------------------------------------------------------------------------

# 18. Important Backend Security Rules

Do not:

``` text
Store plain passwords
Expose password hashes
Expose JWT secrets
Commit .env
Trust owner_id from frontend input
Trust role from frontend input
Trust status from frontend input
Return unnecessary private information
```

Backend should validate:

``` text
Authentication
Authorization
Ownership
Input data
Role
Status transitions
Business rules
```

Use:

``` text
401
```

for unauthenticated requests.

Use:

``` text
403
```

for authenticated users without permission.

Use:

``` text
404
```

when an authorized lookup cannot find a record.

Use:

``` text
409
```

for appropriate conflicts/duplicate/business conflicts.

------------------------------------------------------------------------

# 19. Do Not Install These

Do NOT add:

``` text
SQLite
```

NallaBid uses MySQL.

Do not add another ORM.

Do not add another password hashing system instead of Argon2.

Do not replace OAuth2/JWT with a different authentication architecture
without agreement.

Do not add Bootstrap through CDN when the project already uses npm
packages.

Do not install unnecessary frontend UI frameworks.
