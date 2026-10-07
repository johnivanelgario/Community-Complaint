# Community Complaint & Services (MERN)

## Requirements
- Node.js 18 or newer
- MongoDB running locally (or a MongoDB Atlas connection string)

## Setup

Open the project in VS Code, then open two terminals.

Terminal 1, the API:
```
cd server
npm install
npm run seed
npm run dev
```

Terminal 2, the React app:
```
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Accounts
The sign-in page has a Student / Admin switch.
- Admin: admin@ccs.local / admin123 (created by `npm run seed`)
- Students: pick Student, then "Register as a student"

More admins:
- From the app: User management, Add user, set Role to Admin
- From the terminal (inside `server`):
  - new admin: `npm run make-admin -- teacher@school.edu secret123 Maria Santos`
  - promote an existing account: `npm run make-admin -- student@school.edu`

## What admins can do
- Overview of urgent, unassigned and unanswered complaints
- Reply, change status, set priority (low, normal, urgent) and assign to an office
- Keep internal notes students can't see
- See a timeline of every change on a complaint
- Filter complaints by status, priority and office, and export them to CSV
- Post, pin, edit and remove announcements that appear on student dashboards
- Add, edit, deactivate and delete accounts, including other admins
- Read system logs and print reports

Change `JWT_SECRET` in `server/.env` before deploying. If you use Atlas, replace `MONGO_URI` with your connection string.

## Folder structure
```
server/
  config/db.js
  middleware/  auth.js, upload.js
  models/      User.js, Complaint.js, Log.js
  routes/      auth, users, complaints, logs, stats
  utils/logger.js
  uploads/     complaint photos
client/src/
  components/  Layout (sidebar + topbar), Modal, Guard, StatusBadge...
  context/AuthContext.jsx
  pages/
    Login, Register, Settings, ComplaintDetail
    admin/  Overview, Users, Logs, Reports, Complaints
    student/ Dashboard, NewComplaint, MyComplaints, Faq
```

## API
| Method | Route | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login, /api/auth/logout | public / signed in |
| GET, PUT | /api/auth/me | signed in |
| GET, POST, PUT, DELETE | /api/users | admin |
| GET, POST | /api/complaints | students see their own, admin sees all |
| GET | /api/complaints/:id | owner or admin |
| PUT | /api/complaints/:id | admin (status + reply) |
| DELETE | /api/complaints/:id | admin, or owner while pending |
| GET | /api/logs | admin |
| GET | /api/stats/admin, /api/stats/me | admin / signed in |
| GET | /api/announcements | signed in |
| POST, PUT, DELETE | /api/announcements | admin |
