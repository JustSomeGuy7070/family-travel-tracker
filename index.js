import express from "express";
import pg from "pg";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile();
} catch {
  // .env is optional in production because hosts usually provide env vars.
}

const app = express();
const port = process.env.PORT || 3000;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const sslDisabled =
  process.env.PGSSLMODE === "disable" || connectionString?.includes("sslmode=disable");

const dbConfig = connectionString
  ? {
      connectionString,
      ssl: sslDisabled ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.PGUSER || process.env.DB_USER || "postgres",
      host: process.env.PGHOST || process.env.DB_HOST || "localhost",
      database: process.env.PGDATABASE || process.env.DB_NAME || "world",
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      port: Number(process.env.PGPORT || process.env.DB_PORT || 5433),
    };

const db = new pg.Pool(dbConfig);

db.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let users = [
  { id: 1, name: "Gee", color: "teal" },
  { id: 2, name: "Zee", color: "powderblue" },
];

const countryAliases = {
  america: "united states of america",
  us: "united states of america",
  usa: "united states of america",
  "united states": "united states of america",
};

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split("; ") || [];
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1]) : undefined;
}

function selectUserId(req, availableUsers) {
  const cookieUserId = Number(getCookie(req, "currentUserId"));
  const selectedUser = availableUsers.find((user) => user.id === cookieUserId);
  return selectedUser?.id || availableUsers[0]?.id;
}

function saveSelectedUser(res, userId) {
  res.cookie("currentUserId", String(userId), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });
}

async function checkVisited(userId) {
  const result = await db.query(
    "SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [userId]
  );
  return result.rows.map((country) => country.country_code);
}

async function getUsers() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users;
}

async function renderHome(req, res, error) {
  const allUsers = await getUsers();

  if (allUsers.length === 0) {
    return res.render("new.ejs");
  }

  const currentUserId = selectUserId(req, allUsers);
  const currentUser = allUsers.find((user) => user.id === currentUserId);
  const countries = await checkVisited(currentUserId);
  saveSelectedUser(res, currentUserId);

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: allUsers,
    color: currentUser.color,
    error: error,
  });
}

app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/", asyncHandler(async (req, res) => {
  await renderHome(req, res);
}));

app.get("/new", (req, res) => {
  res.render("new.ejs");
});

app.post("/add", asyncHandler(async (req, res) => {
  const input = req.body["country"]?.trim();

  if (!input) {
    return renderHome(req, res, "Enter country name");
  }

  const allUsers = await getUsers();
  const currentUserId = selectUserId(req, allUsers);
  const searchTerm = countryAliases[input.toLowerCase()] ?? input.toLowerCase();

  try {
    const result = await db.query(
      `SELECT country_code
       FROM countries
       WHERE LOWER(country_name) LIKE '%' || $1 || '%'
          OR LOWER(country_code) = $1
       ORDER BY
         CASE
           WHEN LOWER(country_name) = $1 OR LOWER(country_code) = $1 THEN 0
           WHEN LOWER(country_name) LIKE $1 || '%' THEN 1
           ELSE 2
         END,
         LENGTH(country_name)
       LIMIT 1;`,
      [searchTerm]
    );

    const data = result.rows[0];
    if (!data) {
      return renderHome(req, res, "Country does not exist");
    }

    const countryCode = data.country_code;
    const existingCountry = await db.query(
      "SELECT 1 FROM visited_countries WHERE country_code = $1 AND user_id = $2",
      [countryCode, currentUserId]
    );

    if (existingCountry.rows.length > 0) {
      return renderHome(req, res, "Country has already been added");
    }

    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      return renderHome(req, res, "Country has already been added");
    }
  } catch (err) {
    console.log(err);
    return renderHome(req, res, "Country does not exist");
  }
}));

app.post("/user", asyncHandler(async (req, res) => {
  if (req.body.add === "new") {
    res.redirect("/new");
  } else {
    saveSelectedUser(res, req.body.user);
    res.redirect("/");
  }
}));

app.post("/new", asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const color = req.body.color;

  if (!name || !color) {
    return res.render("new.ejs");
  }

  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
      [name, color]
    );

    const id = result.rows[0].id;
    saveSelectedUser(res, id);

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.render("new.ejs");
  }
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Please try again later.");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
