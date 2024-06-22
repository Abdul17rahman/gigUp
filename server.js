const express = require("express");
const path = require("path");
const expresslayout = require("express-ejs-layouts");

const connectDb = require("./utils/db");
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

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/jobs", async (req, res) => {
  const availableJobs = await Job.find({});
  res.render("jobs/jobs", { availableJobs });
});

app.get("/jobs/new", (req, res) => {
  res.render("jobs/new");
});

app.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  const foundJob = await Job.findById(id);
  res.render("jobs/view", { foundJob });
});

app.post("/jobs", async (req, res) => {
  const { job } = req.body;
  job.created_date = Date.now().toString();
  const addJob = Job(job);
  await addJob.save();
  res.redirect("/jobs");
});

app.listen(PORT, () => {
  console.log("Server listening on port: ", PORT);
});
