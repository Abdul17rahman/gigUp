require("dotenv").config();

const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const expresslayout = require("express-ejs-layouts");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("connect-flash");

const connectDb = require("./utils/db");
const AppEror = require("./utils/AppError");
const {
  decorateAsync,
  encryptPassword,
  formatjobTime,
} = require("./utils/utils");
const { sendEmail, sendProposal, proposalRes } = require("./utils/email");
const Job = require("./models/jobs.model");
const {
  validate,
  authenticateEmp,
  authenticateUser,
  isEmployer,
  isUser,
} = require("./middlewares");
const Employer = require("./models/emp.model");
const User = require("./models/user.model");
const Proposal = require("./models/proposal.model");
const Contract = require("./models/contract.model");
const Review = require("./models/review.model");

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

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// View all available jobs
app.get(
  "/jobs",
  decorateAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const totalJobs = await Job.countDocuments({
      status: "active",
      numOfPos: { $gt: 0 },
    });

    const availableJobs = await Job.find({
      status: "active",
      numOfPos: { $gt: 0 },
    })
      .sort({
        created_at: -1,
      })
      .skip(skip)
      .limit(limit)
      .populate("employer");
    if (!availableJobs.length) {
      throw new AppEror("Sorry there are no jobs available.", 404);
    }

    const totalPages = Math.ceil(totalJobs / limit);

    res.render("jobs/jobs", {
      availableJobs,
      current: page,
      totalPages,
      limit,
    });
  })
);

// View a single job
app.get(
  "/jobs/:id",
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const job = await Job.findById(id).populate("employer");
    if (!job) {
      req.flash("error", "This job was delisted or taken already.!");
      return res.redirect("/jobs");
    }
    const foundJob = job.toObject();
    foundJob.created_at = formatjobTime(foundJob.created_at);
    res.render("jobs/view", { foundJob });
  })
);

// Edit employer details
app.put(
  "/employers/:empId/jobs/:id",
  authenticateEmp,
  isEmployer,
  validate("job"),
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const { job } = req.body;
    const editJob = await Job.findByIdAndUpdate(id, job);
    req.flash("success", `Successfully edited ${job.title}`);
    res.redirect(`/jobs/${id}`);
  })
);

// delete an employer account
app.delete(
  "/employers/:empId/jobs/:jobId",
  authenticateEmp,
  isEmployer,
  decorateAsync(async (req, res) => {
    const { jobId } = req.params;
    const del = await Job.findByIdAndDelete(jobId);
    req.flash("success", "Job deleted successfully.");
    res.redirect("/jobs");
  })
);

// Add a new employer form.
app.get("/employers/register", (req, res) => {
  res.render("employers/register");
});

app.get("/employers/login", (req, res) => {
  req.session.destroy();
  res.render("employers/login");
});

// employer's profile
app.get(
  "/employers/:id",
  authenticateEmp,
  isEmployer,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundEmp = await Employer.findById(id)
      .populate("jobs")
      .populate({
        path: "reviews",
        match: { employer: id },
      });
    if (!foundEmp) {
      throw new AppEror("Employer doesn't exist in our database.!", 400);
    }
    res.render("employers/show", { employer: foundEmp });
  })
);

// post req to add a new employer
app.post(
  "/employers",
  validate("emp"),
  decorateAsync(async (req, res) => {
    const { emp } = req.body;
    const employer = await encryptPassword(emp);
    employer.verification_token = new Date().getTime();
    const newEmp = new Employer(employer);
    await sendEmail("Verification", "employer", "Verify Account", newEmp);
    await newEmp.save();
    req.flash(
      "success",
      "Employer account created, Please visit your email for verification.!"
    );
    res.redirect("/employers/login");
  })
);

// post req to login as an employer
app.post(
  "/employers/login",
  decorateAsync(async (req, res) => {
    const { emp } = req.body;
    const employer = await Employer.findOne({
      email: emp.email,
      isVerified: true,
    });
    if (!employer) {
      req.flash(
        "error",
        "Invalid credentials or account not verified, Please try again."
      );
      return res.redirect("/employers/login");
    }
    const verified = await bcrypt.compare(emp.password, employer.password);

    if (verified) {
      req.session.employer = employer;
      const redirectUrl = req.session.returnTo || `/employers/${employer._id}`;
      req.flash("success", `Welcome back ${employer.username}.`);
      res.redirect(redirectUrl);
    } else {
      req.flash("error", "Invalid credentials, Please try again.");
      res.redirect("/employers/login");
    }
  })
);

// verify employer account
app.get(
  "/verifyEmail/:emailId/:token/employer",
  decorateAsync(async (req, res) => {
    const { emailId, token } = req.params;
    const employer = await Employer.findOne({
      email: emailId,
      verification_token: parseInt(token),
    });

    if (!employer) {
      req.flash("error", "User doesn't exist or verification token is expired");
      return res.redirect("/register");
    }
    employer.isVerified = true;
    await employer.save();
    req.flash("success", "Account verified successfully, you can now login.");
    res.redirect("/employers/login");
  })
);

// post request to logout - generic
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// del route to delete employer
app.delete(
  "/employers/:id",
  authenticateEmp,
  isEmployer,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const delUser = await Employer.findByIdAndDelete(id);
    req.flash("success", "Account deleted succcessfully.");
    req.session.destroy();
    res.redirect("/");
  })
);

// post to add new a job.
app.get("/employers/:id/jobs/new", authenticateEmp, isEmployer, (req, res) => {
  const { id } = req.params;
  res.render("jobs/new", { id });
});

// post route to add a new job
app.post(
  "/employers/:id/jobs",
  authenticateEmp,
  isEmployer,
  validate("job"),
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const employer = await Employer.findById(id);
    const { job } = req.body;
    const addJob = new Job(job);
    employer.jobs.push(addJob);
    addJob.employer = employer;
    await employer.save();
    await addJob.save();
    req.flash("success", "Succcessfully posted job..");
    res.redirect(`/employers/${employer._id}`);
  })
);

// employers - proposals
app.get(
  "/employers/:id/proposals",
  authenticateEmp,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const proposals = await Proposal.find()
      .populate({
        path: "job",
        match: { employer: id },
      })
      .populate("user");
    const empProposals = proposals.filter((p) => p.job !== null);
    res.render("employers/proposals", { empProposals });
  })
);

// employers -- reject the proposal
app.put(
  "/employers/:id/proposal/:pId/reject",
  authenticateEmp,
  decorateAsync(async (req, res) => {
    const { id, pId } = req.params;
    const proposal = await Proposal.findByIdAndUpdate(pId, {
      status: "Rejected",
    })
      .populate({
        path: "user",
      })
      .populate({
        path: "job",
      });
    await proposalRes(proposal.user, proposal.job, proposal, "Rejected");
    req.flash("success", "Proposal details sent to applicant.");
    res.redirect(`/employers/${id}`);
  })
);

// employers -- accept the proposal
app.post(
  "/employers/:id/proposal/:pId/accept",
  authenticateEmp,
  decorateAsync(async (req, res) => {
    const { id, pId } = req.params;

    const proposal = await Proposal.findByIdAndUpdate(pId, {
      status: "Accepted",
    }).populate("user");

    const job = await Job.findById(proposal.job);

    if (job.numOfPos > 1) {
      job.numOfPos--;
    }

    const contract = new Contract({ status: "Running" });
    contract.proposal = proposal;

    job.contract = contract;
    if (job.numOfPos === 1) {
      job.status = "taken";
    }

    await proposalRes(proposal.user, job, proposal, "Accepted");

    await job.save();

    await contract.save();

    req.flash("success", "Proposal accepted, applicant has been notified.");
    res.redirect(`/employers/${id}`);
  })
);

//Employer - contracts.....
app.get(
  "/employers/:id/contracts",
  authenticateEmp,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundContracts = await Contract.find().populate({
      path: "proposal",
      populate: {
        path: "job",
      },
    });
    const contracts = foundContracts.filter(
      (c) =>
        c.proposal && c.proposal.job && String(c.proposal.job.employer) === id
    );
    res.render("employers/contracts", { contracts });
  })
);

// employer completes contract
app.put(
  "/employers/:id/contracts/:cId/complete",
  authenticateEmp,
  decorateAsync(async (req, res) => {
    const { id, cId } = req.params;
    const contract = await Contract.findByIdAndUpdate(cId, {
      status: "Completed",
    });
    req.flash(
      "success",
      "The contract was successfully completed, Thank you.!"
    );
    res.redirect(`/employers/${id}`);
  })
);

// employer reviews.
app.post(
  "/employers/:empId/review/:id/job/",
  authenticateEmp,
  validate("review"),
  decorateAsync(async (req, res) => {
    const { id, empId } = req.params;
    const { title } = req.query;
    const { review } = req.body;
    const user = await User.findById(id);

    const newReview = new Review(review);
    newReview.jobTitle = title;
    newReview.user = user;

    user.reviews.push(newReview);

    await newReview.save();
    await user.save();
    req.flash("success", "Thank you for your feedback.!");
    res.redirect(`/employers/${empId}`);
  })
);

// Users routes
app.get("/register", (req, res) => {
  res.render("users/register");
});

app.get("/users/login", (req, res) => {
  req.session.destroy();
  res.render("users/login");
});

// view user profile
app.get(
  "/user/:id",
  authenticateUser,
  isUser,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundUser = await User.findById(id)
      .populate("proposals")
      .populate({
        path: "reviews",
        match: { user: id },
      });
    if (!foundUser) {
      req.flash("error", "User account doesn't exit!.");
      return res.redirect("/register");
    }
    const jobs = await Promise.all(
      foundUser.proposals.map(async (p) => {
        return await Job.findById(p.job);
      })
    );
    foundUser.jobs = jobs;
    res.render("users/show", { foundUser });
  })
);

// post req to login as user
app.post(
  "/users/login",
  decorateAsync(async (req, res) => {
    const { user } = req.body;
    const foundUser = await User.findOne({
      email: user.email,
      isVerified: true,
    });
    if (!foundUser) {
      req.flash(
        "error",
        "Invalid credentials or account not verified. Please try again."
      );
      return res.redirect("/users/login");
    }
    const verified = await bcrypt.compare(user.password, foundUser.password);
    if (verified) {
      req.session.user = foundUser;
      const redirectUrl = req.session.returnTo || `/user/${foundUser._id}`;
      req.flash("success", `Welcome back ${foundUser.username}`);
      res.redirect(redirectUrl);
    } else {
      req.flash("error", "Invalid credentials, Please try again.");
      res.redirect("/users/login");
    }
  })
);

// post route to register new user
app.post(
  "/register",
  validate("user"),
  decorateAsync(async (req, res) => {
    const { user } = req.body;
    const encUser = await encryptPassword(user);
    encUser.verification_token = new Date().getTime();
    const newUser = new User(encUser);
    await sendEmail("Verification", "user", "Verify Account", encUser);
    await newUser.save();
    req.flash(
      "success",
      "Account created succcessfully, Please check your email and verify the account to login."
    );
    res.redirect(`/users/login`);
  })
);

// verify user account
app.get(
  "/verifyEmail/:emailId/:token/user",
  decorateAsync(async (req, res) => {
    const { emailId, token } = req.params;
    const user = await User.findOne({
      email: emailId,
      verification_token: parseInt(token),
    });

    if (!user) {
      req.flash("error", "User doesn't exist or verification token is expired");
      return res.redirect("/register");
    }
    user.isVerified = true;
    await user.save();
    req.flash("success", "Account verified successfully, you can now login.");
    res.redirect("/users/login");
  })
);

// put route to edit user profile
app.put(
  "/user/:id",
  authenticateUser,
  isUser,
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

// post route to delete a user
app.delete(
  "/user/:id",
  authenticateUser,
  isUser,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const delUser = await User.findByIdAndDelete(id);
    req.flash("success", "Account deleted succcessfully.");
    req.session.destroy();
    res.redirect("/jobs");
  })
);

// proposals user page
app.get(
  "/jobs/:jobId/apply/",
  authenticateUser,
  decorateAsync(async (req, res) => {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    res.render("users/apply", { job });
  })
);

// Apply for a job
app.post(
  "/jobs/:jobId/apply",
  authenticateUser,
  validate("proposal"),
  decorateAsync(async (req, res) => {
    const { jobId } = req.params;
    const { proposal } = req.body;
    const job = await Job.findById(jobId);
    const user = await User.findById(req.session.user._id);
    const employer = await Employer.findById(job.employer._id);
    const hasApplied = await Proposal.exists({ job: jobId, user: user._id });
    if (hasApplied) {
      req.flash("error", "You already applied for this job.!");
      return res.redirect(`/user/${user._id}`);
    }
    proposal.job = job;
    proposal.user = user;
    const newProposal = new Proposal(proposal);
    employer.proposals.push(newProposal);
    user.proposals.push(newProposal);
    job.proposals.push(newProposal);
    await job.save();
    await employer.save();
    await user.save();
    await newProposal.save();
    await sendProposal(user, job, employer, newProposal);

    req.flash("success", "Thank you for applying, check status in proposals.");
    res.redirect(`/user/${user._id}`);
  })
);

// User Proposals
app.get(
  "/user/:id/proposals",
  authenticateUser,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const proposals = await Proposal.find({ user: id }).populate("job");
    res.render("users/proposals", { proposals });
  })
);

app.delete(
  "/user/:id/proposals/:pId",
  authenticateUser,
  decorateAsync(async (req, res) => {
    const { id, pId } = req.params;
    const del = await Proposal.findByIdAndDelete(pId);
    req.flash("success", "Proposal cancelled successfully.");
    res.redirect(`/user/${id}/proposals`);
  })
);

// contracts for users.
app.get(
  "/user/:id/contracts",
  authenticateUser,
  decorateAsync(async (req, res) => {
    const { id } = req.params;
    const foundContracts = await Contract.find().populate({
      path: "proposal",
      match: { user: id },
      populate: {
        path: "job",
      },
    });
    const contracts = foundContracts.filter(
      (c) => c.proposal && c.proposal.job
    );
    res.render("users/contracts", { contracts });
  })
);

// User reviews.
app.post(
  "/user/:id/review/:empId/job/",
  authenticateUser,
  validate("review"),
  decorateAsync(async (req, res) => {
    const { id, empId } = req.params;
    const { title } = req.query;
    const { review } = req.body;
    // const user = await User.findById(id);
    const employer = await Employer.findById(empId);

    const newReview = new Review(review);
    newReview.jobTitle = title;
    newReview.employer = employer;

    employer.reviews.push(newReview);

    await newReview.save();
    await employer.save();
    req.flash("success", "Thank you for your feedback.!");
    res.redirect(`/user/${id}`);
  })
);

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
