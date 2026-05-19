# Family Travel Tracker

A full-stack travel tracking application built with Node.js, Express, EJS, and PostgreSQL.

The project lets family members track the countries they have visited on an interactive world map.

---

## 🚀 Live Demo

Coming soon.

---

## 📌 Features

- Add family members with custom profile colors
- Switch between different family members
- Search and add visited countries
- Highlight visited countries on an interactive SVG world map
- Track each user's total number of visited countries
- Prevent duplicate country entries
- Responsive layout for smaller screens
- PostgreSQL database integration
- Environment-based database configuration for local and deployed environments

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- EJS
- PostgreSQL
- pg
- HTML5
- CSS3
- JavaScript

---

## ⚙️ How It Works

- The Express server handles routes for users and visited countries
- EJS templates dynamically render the map, user tabs, colors, and totals
- PostgreSQL stores users, country data, and visited country records
- The app looks up country names from the `countries` table and saves the matching country code
- The SVG map uses country codes to highlight visited countries
- Environment variables are used for database configuration in local and deployed environments

---

## 🗄️ Database Structure

The application uses PostgreSQL with relational tables for:

- `users` stores family member names and profile colors
- `countries` stores country names and country codes
- `visited_countries` stores which countries each user has visited

The `visited_countries` table connects users to countries so each family member can have their own travel history.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory for local development.

For a hosted PostgreSQL provider such as Neon, use a connection string:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require
PORT=3000
```

For a local PostgreSQL database, use:

```env
PGUSER=postgres
PGHOST=localhost
PGDATABASE=world
PGPASSWORD=your_password
PGPORT=5432
PORT=3000
```

Do not commit your `.env` file.

---

## 🧰 Local Setup

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/family-travel-tracker.git
```

2. Move into the project folder:

```bash
cd family-travel-tracker
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file using `.env.example` as a guide.

5. Set up the database tables using:

```bash
db/schema.sql
```

6. Make sure the `countries` table is populated with country names and country codes.

The included `family_travel_tracker.sql` file contains the project data export.

7. Start the app:

```bash
npm start
```

For development with nodemon:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 🌐 Deployment Notes

- Set `DATABASE_URL` in your hosting provider's environment variables
- Use the full Neon connection string with `sslmode=require`
- The app listens on `process.env.PORT`, which most hosting providers set automatically
- `/health` returns `ok` and can be used as a basic health check endpoint

---

## 👨‍💻 Author

Built as part of my self-taught full-stack development journey.
