const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const Employer = require("../models/emp.model");
const Job = require("../models/jobs.model");
const Proposal = require("../models/proposal.model");
const Contract = require("../models/contract.model");
const Review = require("../models/review.model");
const { decorateAsync, encryptPassword } = require("../utils/utils");
const { sendEmail } = require("../utils/email");
const { isUser, authenticateUser, validate } = require("../middlewares/index");

class UserController {
  // display registration form
  static register(req, res) {
    res.render("users/register");
  }

  // display login form
  static login(req, res) {
    req.session.destroy();
    res.render("users/login");
  }

  // show user profile
  static getUser = [
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
    }),
  ];

  // register a new user
  static addUser = [
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
    }),
  ];

  // Login a user
  static loginUser = [
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
    }),
  ];

  // verify user
  static verifyUser = [
    decorateAsync(async (req, res) => {
      const { emailId, token } = req.params;
      const user = await User.findOne({
        email: emailId,
        verification_token: parseInt(token),
      });

      if (!user) {
        req.flash(
          "error",
          "User doesn't exist or verification token is expired"
        );
        return res.redirect("/register");
      }
      user.isVerified = true;
      await user.save();
      req.flash("success", "Account verified successfully, you can now login.");
      res.redirect("/users/login");
    }),
  ];

  // edit user profile
  static editUser = [
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
    }),
  ];

  // delete user
  static delUser = [
    authenticateUser,
    isUser,
    decorateAsync(async (req, res) => {
      const { id } = req.params;
      const delUser = await User.findByIdAndDelete(id);
      req.flash("success", "Account deleted succcessfully.");
      req.session.destroy();
      res.redirect("/jobs");
    }),
  ];

  // user proposals
  static userProposal = [
    authenticateUser,
    decorateAsync(async (req, res) => {
      const { id } = req.params;
      const proposals = await Proposal.find({ user: id }).populate("job");
      res.render("users/proposals", { proposals });
    }),
  ];

  // delete proposals
  static delProposal = [
    authenticateUser,
    decorateAsync(async (req, res) => {
      const { id, pId } = req.params;
      const del = await Proposal.findByIdAndDelete(pId);
      req.flash("success", "Proposal cancelled successfully.");
      res.redirect(`/user/${id}/proposals`);
    }),
  ];

  // show contracts
  static contracts = [
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
    }),
  ];

  // add reviews
  static addReview = [
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
    }),
  ];
}

module.exports = UserController;
