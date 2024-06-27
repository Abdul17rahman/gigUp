const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const expresslayout = require("express-ejs-layouts");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");

const connectDb = require("./utils/db");
const AppEror = require("./utils/AppError");
const { decorateAsync, encryptPassword } = require("./utils/utils");
const Job = require("./models/jobs.model");
const { validate } = require("./middlewares");
const Employer = require("./models/emp.model");
const User = require("./models/user.model");

const app = express();
connectDb("gigUp");
const PORT = process.env.PORT || 3000;

// Use session
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
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

app.get(
  "/jobs/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundJob = await Job.findById(id).populate("employer");
    if (!foundJob) {
      throw new AppEror(
        "This job doesn't exist or it's already delisted.",
        404
      );
    }
    res.render("jobs/view", { foundJob });
  })
);

app.put(
  "/employers/:empId/jobs/:id",
  validate("job"),
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const { job } = req.body;
    const editJob = await Job.findByIdAndUpdate(id, job);
    req.flash("success", `Successfully edited ${job.title}`);
    res.redirect(`/jobs/${id}`);
  })
);

app.delete(
  "/employers/:empId/jobs/:jobId",
  decorateAsync(async (req, res) => {
    const { jobId } = req.params;
    const del = await Job.findByIdAndDelete(jobId);
    req.flash("success", "Job deleted successfully.");
    res.redirect("/jobs");
  })
);

// Employer routes.
app.get(
  "/employers",
  decorateAsync(async (req, res) => {
    const employers = await Employer.find({});
    res.render("employers/index", { employers });
  })
);

app.get("/employers/register", (req, res) => {
  res.render("employers/register");
});

app.get("/employers/login", (req, res) => {
  res.render("employers/login");
});

app.get(
  "/employers/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundEmp = await Employer.findById(id).populate("jobs");
    if (!foundEmp) {
      throw new AppEror("Employer doesn't exist in our database.!", 400);
    }
    res.render("employers/show", { employer: foundEmp });
  })
);

app.post(
  "/employers",
  validate("emp"),
  decorateAsync(async (req, res) => {
    const { emp } = req.body;
    const employer = await encryptPassword(emp);
    const newEmp = new Employer(employer);
    await newEmp.save();
    req.flash("success", "Employer account succesfully created.!");
    res.redirect("/employers/login");
  })
);

app.post(
  "/employers/login",
  decorateAsync(async (req, res) => {
    const { emp } = req.body;
    const employer = await Employer.findOne({ email: emp.email });
    if (!employer) {
      req.flash("error", "Sorry, we can't find this user.!");
      return res.redirect("/employers/login");
    }
    const verified = await bcrypt.compare(emp.password, employer.password);

    if (verified) {
      req.session.employer = employer;
      req.flash("success", "Welcome Back.");
      res.redirect(`/employers/${employer._id}`);
    } else {
      req.flash("error", "Invalid credentials, Please try again.");
      res.redirect("/employers/login");
    }
  })
);

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.delete(
  "/employers/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const delUser = await Employer.findByIdAndDelete(id);
    req.flash("success", "Account deleted succcessfully.");
    res.redirect("/");
  })
);

// post a job.
app.get("/employers/:id/jobs/new", (req, res) => {
  const { id } = req.params;
  res.render("jobs/new", { id });
});

app.post(
  "/employers/:id/jobs",
  validate("job"),
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
    req.flash("success", "Succcessfully posted job..");
    res.redirect(`/employers/${employer._id}`);
  })
);

// Users routes
app.get("/register", (req, res) => {
  res.render("users/register");
});

app.get("/users/login", (req, res) => {
  res.render("users/login");
});

app.get(
  "/user/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundUser = await User.findById(id);
    if (!foundUser) {
      req.flash("error", "User account doesn't exit!.");
      return res.redirect("/register");
    }
    res.render("users/show", { foundUser });
  })
);

app.post("/users/login", async (req, res) => {
  const { user } = req.body;
  const foundUser = await User.findOne({ email: user.email });
  if (!foundUser) {
    req.flash("error", "Sorry, this user doesn't exist.");
    return res.redirect("/users/login");
  }
  const verified = await bcrypt.compare(user.password, foundUser.password);
  if (verified) {
    req.session.user = foundUser;
    res.redirect(`/user/${foundUser._id}`);
  } else {
    req.flash("success", "Invalid credentials.");
    res.redirect("/users/login");
  }
});

app.post(
  "/register",
  validate("user"),
  decorateAsync(async (req, res) => {
    const { user } = req.body;
    const encUser = await encryptPassword(user);
    const newUser = new User(encUser);
    await newUser.save();
    req.flash("success", "Account created succcessfully.");
    res.redirect(`/users/login`);
  })
);

app.put(
  "/user/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const { user } = req.body;
    const foundUser = await User.findByIdAndUpdate(id, {
      email: user["email"],
      bio: user["bio"],
    });
    req.flash("success", "Account edited succcessfully.");
    res.redirect(`/user/${foundUser._id}`);
  })
);

app.delete(
  "/user/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const delUser = await User.findByIdAndDelete(id);
    req.flash("success", "Account deleted succcessfully.");
    res.redirect("/jobs");
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
