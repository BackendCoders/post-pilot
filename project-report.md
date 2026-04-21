# Post-Pilot - Project Report

## Overview

Post-Pilot is a WhatsApp-based CRM application for lead generation and customer outreach. It allows users to scrape business leads from Google Maps, manage them in a kanban/list view, and send bulk WhatsApp messages to connect with potential customers.

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **WhatsApp**: Baileys library
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Routing**: React Router DOM
- **Notifications**: Sonner

---

## Core Features

### 1. Lead Generation (Scrape)

Users can scrape business leads from Google Maps based on:
- Business type (e.g., "restaurants", "salons", "dentists")
- Location (city or area)
- Pagination support

**How it works:**
1. User enters business type and location
2. Backend queries Google Maps via Serper API
3. Results are displayed in a selectable list
4. User selects desired leads and saves them to the CRM

### 2. Lead Management (CRM)

Saved leads are organized in a workspace with:

**Views:**
- **Kanban Board**: Columns for Saved, Processed, Converted, Rejected statuses
- **List View**: Tabular view with filters

**Features:**
- Category-based organization (folders)
- Search and filter leads
- Bulk selection and actions
- Export to CSV
- Status management (move leads between columns)

**Lead Fields:**
- Title (business name)
- Phone number
- Website
- Address
- Category
- Google Maps URL
- Latitude/Longitude
- Rating & Review Count
- Custom Notes

### 3. Lead Details Panel

Clicking a lead opens a details panel showing:
- All lead information
- Status
- Notes
- Quick actions (Edit, Reach, Delete)

### 4. WhatsApp Messaging (Reach)

**Features:**
- Bulk message sending to selected leads
- Message templates with variable substitution
- Auto-progress lead status when message is sent
- Track replies (auto-convert to "Converted" status)

### 5. Create/Edit Leads

Users can:
- Create new leads from scratch
- Edit existing lead information
- Add notes to leads
- Select category from dropdown or create new category

### 6. Visual Indicators

- Converted leads (replied) get a green border highlight

---

## User Management

- **Roles**: User, Admin
- **Authentication**: JWT-based with access and refresh tokens
- **Password Security**: bcrypt hashing with strength validation

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get profile
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Leads
- `POST /api/leads` - Create lead
- `GET /api/leads` - List leads (paginated)
- `GET /api/leads/:id` - Get lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/bulk` - Bulk create
- `PATCH /api/leads/bulk/status` - Bulk status update
- `POST /api/leads/bulk/delete` - Bulk delete
- `POST /api/leads/scrap-map-data` - Scrape from Google Maps

### Lead Categories
- `GET /api/leads/category` - List categories
- `POST /api/leads/category` - Create category

### WhatsApp
- `POST /api/whatsapp/send` - Send message
- `POST /api/whatsapp/send-bulk` - Bulk send
- `GET /api/whatsapp/session` - Get session status
- `POST /api/whatsapp/connect` - Connect/reconnect

---

## Project Structure

```
post-pilot/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app
│   │   ├── config/             # Database config
│   │   ├── middleware/         # Auth, error handling
│   │   ├── modules/
│   │   │   ├── Auth/           # Authentication
│   │   │   ├── LeadGeneration/ # Leads CRUD + scraping
│   │   │   └── WhatsApp/       # WhatsApp messaging
│   │   ├── routes/             # API routes
│   │   └── utils/              # Cloudinary, helpers
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/
│   │   │   ├── auth/           # Login/Register
│   │   │   ├── dashboard/      # Main app
│   │   │   │   └── lead-generation/
│   │   │   │       ├── components/
│   │   │   │       │           # Lead UI components
│   │   │   │       └── pages/
│   │   │   └── profile/
│   │   ├── query/              # TanStack Query hooks
│   │   ├── service/            # API calls
│   │   └── type.d.ts           # TypeScript types
│   └── package.json
│
└── project-report.md
```

---

## Features Implemented (Current Session)

1. **Lead Notes**
   - Add/edit/delete notes per lead
   - Pencil icon on lead cards

2. **Edit Lead Dialog**
   - Edit any lead field in a dialog form

3. **Auto Progress Status**
   - Saved → Processed when message sent
   - Processed → Converted when lead replies

4. **Visual Indicators**
   - Green border for converted leads

5. **Scrollbar Hide**
   - Clean vertical scrolling

6. **Create Lead**
   - Create new leads from scratch
   - Category dropdown with existing + create new

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- WhatsApp number for Baileys

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables (Backend)
- `NODE_ENV` - development/production
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `SERPER_API_KEY` - Google Maps scraping
- `CLOUDINARY_*` - Image uploads

---

## Security Features

- JWT authentication with short-lived access tokens
- Role-based authorization
- Input validation with Zod
- SQL injection prevention (MongoDB)
- Rate limiting
- Helmet security headers
- CORS configuration