const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const expresslayout = require("express-ejs-layouts");

const connectDb = require("./utils/db");
const AppEror = require("./utils/AppError");
const decorateAsync = require("./utils/utils");
const Job = require("./models/jobs.model");
const validateJob = require("./middlewares");
const Employer = require("./models/emp.model");

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

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

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
    const foundJob = await Job.findById(id).populate("employer", "company");
    if (!foundJob) {
      throw new AppEror(
        "This job doesn't exist or it's already delisted.",
        404
      );
    }
    res.render("jobs/view", { foundJob });
  })
);

// app.post(
//   "/jobs",
//   validateJob,
//   decorateAsync(async (req, res) => {
//     const { job } = req.body;
//     job.created_date = Date.now().toString();
//     const addJob = new Job(job);
//     await addJob.save();
//     res.redirect("/jobs");
//   })
// );

app.put(
  "/jobs/:id",
  validateJob,
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

// Employer routes.
app.get("/employers", async (req, res) => {
  const employers = await Employer.find({});
  res.render("employers/index", { employers });
});

app.get("/employers/register", (req, res) => {
  res.render("employers/register");
});

app.get("/employers/:id", async (req, res) => {
  const { id } = req.params;
  const foundEmp = await Employer.findById(id).populate("jobs");
  if (!foundEmp) {
    throw new AppEror("Employer doesn't exist in our database.!", 400);
  }
  res.render("employers/show", { employer: foundEmp });
});

app.post("/employers", async (req, res) => {
  const { emp } = req.body;
  const newEmp = new Employer(emp);
  await newEmp.save();
  res.redirect(`/employers/${newEmp._id}`);
});

app.delete("/employers/:id", async (req, res) => {
  const { id } = req.params;
  const delUser = await Employer.findByIdAndDelete(id);
  res.redirect("/");
});

// post a job.
app.get("/employers/:id/jobs/new", (req, res) => {
  const { id } = req.params;
  res.render("jobs/new", { id });
});

app.post(
  "/employers/:id/jobs",
  validateJob,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const employer = await Employer.findById(id);
    const { job } = req.body;
    job.created_date = Date.now().toString();
    const addJob = new Job(job);
    employer.jobs.push(addJob);
    addJob.employer = employer;
    await employer.save();
    await addJob.save();
    res.redirect(`/employers/${employer._id}`);
  })
);

// Middleware for non-existing other routes
app.use((req, res) => {
  throw new AppEror("Page or resource not found.!", 400);
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
