const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const expresslayout = require("express-ejs-layouts");

const connectDb = require("./utils/db");
const AppEror = require("./utils/AppError");
const decorateAsync = require("./utils/utils");
const Job = require("./models/jobs.model");

const app = express();
connectDb("gigUp");
const PORT = process.env.PORT || 3000;

// setup the views directory and ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Set layouts
app.set("layout", "partials/boilerPlate");

// Use express middleware to parse form data.
app.use(express.urlencoded({ extended: true }));
app.use(expresslayout);
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.render("index");
});

app.get(
  "/jobs",
  decorateAsync(async (req, res) => {
    const availableJobs = await Job.find({});
    if (!availableJobs) {
      throw new AppEror("Sorry there are no jobs available.", 404);
    }
    res.render("jobs/jobs", { availableJobs });
  })
);

app.get("/jobs/new", (req, res) => {
  res.render("jobs/new");
});

app.get(
  "/jobs/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundJob = await Job.findById(id);
    if (!foundJob) {
      throw new AppEror(
        "This job doesn't exist or it's already delisted.",
        404
      );
    }
    res.render("jobs/view", { foundJob });
  })
);

app.post(
  "/jobs",
  decorateAsync(async (req, res) => {
    const { job } = req.body;
    job.created_date = Date.now().toString();
    const addJob = Job(job);
    await addJob.save();
    res.redirect("/jobs");
  })
);

app.put(
  "/jobs/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const { job } = req.body;
    const editJob = await Job.findByIdAndUpdate(id, job);
    res.redirect(`/jobs/${id}`);
  })
);

app.delete(
  "/jobs/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const del = await Job.findByIdAndDelete(id);
    res.redirect("/jobs");
  })
);

// Middleware for non-existing other routes
app.use((req, res) => {
  res.status(404);
  res.render("error", {
    message: "Sorry, we can't find what you're looking for.!",
  });
});

// Custom error handling middleware
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong.!" } = err;
  res.status(status);
  res.render("error", { message });
});

app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
