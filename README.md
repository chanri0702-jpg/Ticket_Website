# TicketStream 🎟️

A full-stack web application for discovering and booking tickets to concerts, sports events, theater performances, conferences, and more. Built with Node.js, Express, MongoDB, and EJS.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Seeding the Database](#seeding-the-database)
  - [Running the App](#running-the-app)
- [User Roles](#user-roles)
- [Application Pages](#application-pages)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Image Uploads](#image-uploads)
- [Known Issues & Notes](#known-issues--notes)

---

## Overview

TicketStream is a ticket-booking platform that lets users browse events, view seating layouts, select specific seats, and complete bookings. Administrators manage the full lifecycle of events — from creating venues with custom seating blocks, to scheduling show times, responding to user enquiries, and viewing analytics dashboards.

---

## Features

### Public / User-Facing
- Browse and search events by name, date, category, and availability
- View event detail pages with upcoming show times and seat availability
- Interactive seat map with block-level navigation and real-time seat status
- Book one or multiple seats and receive a booking confirmation
- View and cancel existing bookings by email
- Submit support enquiries via a contact form

### Admin
- Full CRUD for **Venues** (including custom seating block/row/seat layout builder and layout image upload)
- Full CRUD for **Events** (with uniform or per-block pricing, and Cloudinary image upload)
- **Show Time** management — add/delete date-time slots per event; reserve seats on behalf of the venue
- **Enquiry management** — view all user enquiries, update status, and send responses
- **Booking Admin dashboard** with analytics:
  - Total bookings, tickets sold, and gross revenue
  - Popular events ranked by ticket count
  - Capacity usage per time slot (with visual progress bars)
  - Bookings-over-time bar chart (last 30 days)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (via Mongoose 9) |
| Templating | EJS 5 |
| Auth | Session-based (express-session) |
| Password hashing | bcrypt |
| File uploads | Multer (memory storage) + Cloudinary |
| Dev tooling | Nodemon |

---

## Project Structure

```
Ticket_Website/
├── controllers/
│   ├── authController.js       # Registration, login, logout, session
│   ├── bookingController.js    # Booking CRUD + admin analytics
│   ├── enqueryController.js    # Enquiry CRUD
│   ├── eventController.js      # Event CRUD + image upload
│   ├── timesController.js      # Time slot CRUD + seat reservation
│   └── venueController.js      # Venue CRUD
│
├── middleware/
│   └── auth.js                 # requireAuth, requireAdmin, setUserLocals
│
├── models/
│   ├── booking.js              # Booking schema
│   ├── enquery.js              # Enquiry schema
│   ├── event.js                # Event schema (supports per-block pricing)
│   ├── times.js                # Time slot + per-seat schema
│   ├── user.js                 # User schema with bcrypt pre-save hook
│   └── venue.js                # Venue schema with seatTemplate
│
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── enqueryRoutes.js
│   ├── eventRoutes.js
│   ├── timesRoutes.js
│   └── venueRoutes.js
│
├── Views/
│   ├── partials/
│   │   ├── header.ejs          # Navbar with role-based links
│   │   └── footer.ejs
│   ├── booking.ejs             # User booking + history
│   ├── booking-admin.ejs       # Admin booking dashboard
│   ├── contact.ejs             # Contact / enquiry form
│   ├── enquiries.ejs           # Admin enquiry management
│   ├── events.ejs              # Admin event management
│   ├── index.ejs               # Public event listing
│   ├── login.ejs
│   ├── register.ejs
│   ├── times-admin.ejs         # Admin time slot management
│   ├── venues.ejs              # Admin venue management
│   └── view-event.ejs          # Public event detail + time picker
│
├── public/
│   ├── css/                    # Per-page stylesheets
│   └── js/
│       ├── booking.js          # Booking tab logic, seat map, analytics
│       ├── contact.js          # Enquiry form submission
│       ├── enquiries.js        # Admin enquiry management
│       ├── events.js           # Admin event form + CRUD
│       ├── times.js            # Admin time slot form + seat reservation
│       └── venues.js           # Admin venue form + seating builder
│
├── seed.js                     # Creates the default admin user
├── server.js                   # App entry point, route mounting, DB connection
├── package.json
└── .env                        # (not committed — see below)
```

---

## Getting Started

### Prerequisites

- **Node.js** v20.19.0 or later
- **MongoDB** — a running local instance or a MongoDB Atlas connection string
- **Cloudinary** account (free tier is sufficient) for image uploads

---

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/chanri0702-jpg/Ticket_Website.git
cd Ticket_Website

# 2. Install dependencies
npm install
```

---

### Environment Variables

Create a `.env` file in the project root. **Do not commit this file** (it is already in `.gitignore`).

```env
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/ticketstream
# or for Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/ticketstream

# Port the server listens on
PORT=3000

# Cloudinary — paste the URL from your Cloudinary dashboard
# Dashboard → Settings → Access Keys → "API environment variable"
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Session secret — used by express-session in server.js
# Falls back to 'ticketstream-secret-key' if not set
SESSION_SECRET=change_me_to_something_random


```

> **Tip:** The app will print a warning on startup if `CLOUDINARY_URL` is missing and will exit if `MONGO_URI` or `PORT` are missing.

---

### Seeding the Database

Run the seed script once to create the default administrator account:

```bash
node seed.js
```

This creates:

| Field | Value |
|---|---|
| Email | `admin@ticketstream.com` |
| Password | `admin123` |
| Role | `admin` |

> Change the admin password after your first login.

---

### Running the App

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## User Roles

| Role | Access |
|---|---|
| **Guest** (not logged in) | Browse events, view event details, submit enquiries, register/login |
| **User** (logged in) | All guest access + book tickets, view/cancel own bookings, view profile |
| **Admin** | All user access + manage venues, events, show times, enquiries, view analytics |

Admin status is determined by `user.role === 'admin'` **or** `user.email === 'admin@ticketstream.com'` (see `middleware/auth.js`).

---

## Application Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Event listing with search and filters (date, availability) |
| `/view-event?id=<id>` | Public | Event detail page with time slot picker |
| `/auth/login` | Guest only | Login form |
| `/auth/register` | Guest only | Registration form |
| `/auth/logout` | Any | Destroys session and redirects to `/` |
| `/booking` | Auth | Book tickets, view booking history |
| `/contact` | Public | Submit a support enquiry |
| `/venues` | Admin | Create and manage venues (with seating layout builder) |
| `/events` | Admin | Create and manage events |
| `/times-admin` | Admin | Manage show times and reserve seats |
| `/enquiries` | Admin | View and respond to user enquiries |
| `/booking-admin` | Admin | Booking dashboard with analytics |

---

## API Reference

All API routes are prefixed with `/api`.

### Auth — `/auth`

| Method | Path | Description |
|---|---|---|
| GET | `/auth/login` | Render login page |
| POST | `/auth/login` | Authenticate user, set session |
| GET | `/auth/register` | Render register page |
| POST | `/auth/register` | Create new user account |
| GET/POST | `/auth/logout` | Destroy session |
| GET | `/auth/me` | Return current session user |

### Events — `/api/events`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Public | List all events (populated with venue) |
| GET | `/api/events/:id` | Public | Get single event |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |

### Venues — `/api/venues`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/venues` | Public | List all venues |
| GET | `/api/venues/:id` | Public | Get single venue |
| POST | `/api/venues` | Admin | Create venue |
| PUT | `/api/venues/:id` | Admin | Update venue |
| DELETE | `/api/venues/:id` | Admin | Delete venue |

### Time Slots — `/api/times`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/times/event/:eventID` | Public | Get all time slots for an event |
| GET | `/api/times/:id` | Public | Get single time slot (with seat data) |
| GET | `/api/times/:id/blocks` | Public | Get seat availability grouped by block |
| POST | `/api/times` | Admin | Create time slot (auto-populates seats from venue template) |
| PUT | `/api/times/:id` | Admin | Update time slot |
| DELETE | `/api/times/:id` | Admin | Delete time slot |
| POST | `/api/times/:id/reserve` | Admin | Reserve seats (by seat IDs or count) |

### Bookings — `/api/bookings`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/bookings/admin/analytics` | Admin | Analytics summary, popular events, capacity, chart data |
| GET | `/api/bookings/user/:email` | Auth | Get all bookings for an email |
| POST | `/api/bookings` | Auth | Create a booking (validates + locks seats) |
| DELETE | `/api/bookings/:id` | Auth | Cancel booking and release seats |

### Enquiries — `/api/enquiries`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/enquiries` | Public | Submit a new enquiry |
| GET | `/api/enquiries/user/:email` | Auth | Get enquiries by email |
| GET | `/api/enquiries` | Admin | Get all enquiries |
| PUT | `/api/enquiries/:id` | Admin | Respond to / update enquiry status |

### Image Upload

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload-image` | Admin | Upload image to Cloudinary, returns `{ url }` |

---

## Data Models

### User
```
email (unique), name, surname, password (bcrypt), phone,
role (admin|user), address1, address2, city, zip, province
```

### Venue
```
name, address1, address2, zip, totalSeats, layoutImage,
seatTemplate: [{ row, seatNumber, block }]
```

### Event
```
name, description, host, category (Concert|Sports|Theater|Conference|Other),
image, price, priceType (uniform|custom), blockPrices (Map),
venueID → Venue
```

### Times (Show Time Slot)
```
eventID → Event, eventTime, seatsAvailable, totalSeats,
seats: [{ row, seatNumber, block, isAvailable, heldUntil, heldBy }]
```

### Booking
```
paydate, email, total, eventID → Event, timeID → Times,
tickets: [{ row, seatNumber, block }]
```

### Enquery (Enquiry)
```
email, subject, message,
status (open|in-progress|resolved),
response, createdAt, resolvedAt
```

---

## Authentication

The app uses **session-based authentication** via `express-session`. On successful login the user object (id, name, email, role) is stored in `req.session.user` and made available to all EJS views via the `setUserLocals` middleware.

**Middleware helpers** (`middleware/auth.js`):

| Helper | Usage |
|---|---|
| `requireAuth` | Redirects unauthenticated requests to `/auth/login` |
| `requireAdmin` | Returns 403 for non-admin users (JSON for API routes, HTML for view routes) |
| `setUserLocals` | Attaches `user`, `isAdmin`, and `isLoggedIn` to `res.locals` for every request |

---

## Image Uploads

Event and venue images are uploaded to **Cloudinary** via `POST /api/upload-image`. The endpoint:

1. Requires admin authentication (`requireAdmin` middleware)
2. Accepts a multipart form with a `file` field (JPEG, PNG, or WebP, max 5 MB)
3. Converts the buffer to a base64 data URI and uploads to the `ticketstream/events` Cloudinary folder
4. Returns `{ url: "<secure_url>" }` which is then stored on the model

If `CLOUDINARY_URL` is not set, the server will warn on startup and all upload requests will fail with a 500 error.

---

## Known Issues & Notes

- **No middleware enforcement on API routes** — the venue, event, and booking API routes have no `requireAdmin` middleware at the router level. Admin-only protection on these endpoints relies on controller-level checks. Adding middleware to those routers is recommended before deploying to production.
- **Enquiry model is named `Enquery`** (typo) throughout the codebase — the collection is explicitly set to `enquiries` in the Mongoose model call, so the data layer is correct.

---

## License

ISC — see `package.json`.

---

*Built for the WPR381 Project — © 2026 TicketStream*