const Job = require("../models/jobs.model");
const Employer = require("../models/emp.model");
const Proposal = require("../models/proposal.model");
const User = require("../models/user.model");
const { decorateAsync, formatjobTime } = require("../utils/utils");
const { authenticateUser, validate } = require("../middlewares/index");
const { sendProposal } = require("../utils/email");
const AppError = require("../utils/AppError");

class JobsController {
  // get all available jobs
  static allJobs = decorateAsync(async (req, res) => {
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
    // if (!availableJobs.length) {
    //   throw new AppError("Sorry there are no jobs available.", 404);
    // }

    const totalPages = Math.ceil(totalJobs / limit);

    res.render("jobs/jobs", {
      availableJobs,
      current: page,
      totalPages,
      limit,
    });
  });

  // gets a single job
  static getJob = decorateAsync(async (req, res) => {
    const { id } = req.params;
    const job = await Job.findById(id).populate("employer");
    if (!job) {
      req.flash("error", "This job was delisted or taken already.!");
      return res.redirect("/jobs");
    }
    const foundJob = job.toObject();
    foundJob.created_at = formatjobTime(foundJob.created_at);
    res.render("jobs/view", { foundJob });
  });

  // apply for a job
  static applyJobForm = [
    authenticateUser,
    decorateAsync(async (req, res) => {
      const { jobId } = req.params;
      const job = await Job.findById(jobId);
      res.render("users/apply", { job });
    }),
  ];

  static applyJob = [
    authenticateUser,
    validate("proposal"),
    decorateAsync(async (req, res) => {
      const { jobId } = req.params;
      const { proposal } = req.body;
      const job = await Job.findById(jobId);
      const user = await User.findById(req.session.user._id);
      const employer = await Employer.findById(job.employer._id);
      const hasApplied = await Proposal.exists({
        job: jobId,
        user: user._id,
      });
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

      req.flash(
        "success",
        "Thank you for applying, check status in proposals."
      );
      res.redirect(`/user/${user._id}`);
    }),
  ];
}

module.exports = JobsController;
