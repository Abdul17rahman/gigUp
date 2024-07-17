const bcrypt = require("bcrypt");
const Employer = require("../models/emp.model");
const Job = require("../models/jobs.model");
const Proposal = require("../models/proposal.model");
const Contract = require("../models/contract.model");
const Review = require("../models/review.model");
const User = require("../models/user.model");
const { decorateAsync, encryptPassword } = require("../utils/utils");
const { sendEmail, proposalRes } = require("../utils/email");
const AppError = require("../utils/AppError");
const {
  isEmployer,
  authenticateEmp,
  validate,
} = require("../middlewares/index");

class EmployerController {
  // renders the registration page
  static register(req, res) {
    res.render("employers/register");
  }
  // renders the login page
  static login(req, res) {
    req.session.destroy();
    res.render("employers/login");
  }

  // gets a single employer
  static getEmployer = [
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
        throw new AppError("Employer doesn't exist in our database.!", 400);
      }
      res.render("employers/show", { employer: foundEmp });
    }),
  ];

  // dsiplay employer's contracts
  static displayContracts = [
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

      // Custom sort function to sort by status
      contracts.sort((a, b) => {
        const statusOrder = {
          Running: 1,
          Completed: 2,
        };

        return statusOrder[a.status] - statusOrder[b.status];
      });

      res.render("employers/contracts", { contracts });
    }),
  ];

  // display the add job form
  static addJob = [
    authenticateEmp,
    isEmployer,
    (req, res) => {
      const { id } = req.params;
      res.render("jobs/new", { id });
    },
  ];

  // verify login
  static verifyEmployer = [
    decorateAsync(async (req, res) => {
      const { emailId, token } = req.params;
      const employer = await Employer.findOne({
        email: emailId,
        verification_token: parseInt(token),
      });

      if (!employer) {
        req.flash(
          "error",
          "User doesn't exist or verification token is expired"
        );
        return res.redirect("/register");
      }
      employer.isVerified = true;
      await employer.save();
      req.flash("success", "Account verified successfully, you can now login.");
      res.redirect("/employers/login");
    }),
  ];

  // registers an employer
  static addEmployer = [
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
    }),
  ];

  // delete an employer account
  static delEmployer = [
    authenticateEmp,
    isEmployer,
    decorateAsync(async (req, res) => {
      const { id } = req.params;
      const delUser = await Employer.findByIdAndDelete(id);
      req.flash("success", "Account deleted succcessfully.");
      req.session.destroy();
      res.redirect("/home");
    }),
  ];

  // Posts a new job
  static postJob = [
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
    }),
  ];

  // Edit job details
  static editJob = [
    authenticateEmp,
    isEmployer,
    validate("job"),
    decorateAsync(async (req, res) => {
      const { jobId } = req.params;
      const { job } = req.body;
      const editJob = await Job.findByIdAndUpdate(jobId, job);
      req.flash("success", `Successfully edited ${job.title}`);
      res.redirect(`/jobs/${jobId}`);
    }),
  ];

  // Login the employer
  static loginEmployer = [
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
        const redirectUrl =
          req.session.returnTo || `/employers/${employer._id}`;
        req.flash("success", `Welcome back ${employer.username}.`);
        res.redirect(redirectUrl);
      } else {
        req.flash("error", "Invalid credentials, Please try again.");
        res.redirect("/employers/login");
      }
    }),
  ];

  // delete an job
  static delJob = [
    authenticateEmp,
    isEmployer,
    decorateAsync(async (req, res) => {
      const { id, jobId } = req.params;
      const del = await Job.findByIdAndDelete(jobId);
      req.flash("success", "Job deleted successfully.");
      res.redirect(`/employers/${id}`);
    }),
  ];

  // display proposals
  static empProposals = [
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

      // Custom sort function to sort by status
      empProposals.sort((a, b) => {
        const statusOrder = {
          Pending: 1,
          Accepted: 2,
          Rejected: 3,
        };

        return statusOrder[a.status] - statusOrder[b.status];
      });
      res.render("employers/proposals", { empProposals });
    }),
  ];

  // reject proposals
  static rejectProposal = [
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
    }),
  ];

  // accept proposals
  static acceptProposal = [
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
    }),
  ];

  // complete contract
  static completeContract = [
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
    }),
  ];

  // Add a review
  static addReview = [
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
    }),
  ];
}

module.exports = EmployerController;
