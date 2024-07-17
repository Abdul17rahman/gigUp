require("dotenv").config();

const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const expresslayout = require("express-ejs-layouts");
const session = require("express-session");
const flash = require("connect-flash");

const connectDb = require("./utils/db");
const AppEror = require("./utils/AppError");
const router = require("./routes/index");

const app = express();
connectDb("gigUp");
const PORT = process.env.PORT || 3000;

// Use session
app.use(
  session({
    secret: `${process.env.MY_SECRET}`,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production", // Ensures the cookie is only used over HTTPS
      httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JavaScript, helping to protect against XSS
    },
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.employer = req.session.employer || null;
  res.locals.user = req.session.user || null;
  next();
});

// setup the views directory and ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Set layouts
app.set("layout", "partials/boilerPlate");

// Use express middleware to parse form data.
app.use(express.urlencoded({ extended: true }));
app.use(expresslayout);
app.use(methodOverride("_method"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// routing to home
app.get("/", (req, res) => {
  res.redirect("/home");
});

// router file with all endpoints
app.use("/", router);

// Middleware for non-existing other routes
app.use((req, res) => {
  throw new AppEror("Page or resource not found.!", 400);
});

// Handle mongoose errors.
app.use((err, req, res, next) => {
  if (err.CastError) {
    err.message = "Key or value doesn't exist.";
    err.status = 400;
  }
  if (err.ValidationError) {
    err.message = "Validation failed, missing a field.";
    err.status = 404;
  }
  if (err.code === 11000) {
    err.message = "Account already exists.";
    err.status = 409;
  }
  next(err);
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong.!", stack } = err;
  res.status(status);
  res.render("error", { message, stack });
});

app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
