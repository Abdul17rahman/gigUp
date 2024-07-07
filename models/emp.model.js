const mongoose = require("mongoose");
const Job = require("./jobs.model");
const Proposal = require("../models/proposal.model");
const Contract = require("../models/contract.model");
const Review = require("../models/review.model");

const { Schema } = mongoose;

const employerSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  company: {
    type: String,
  },
  location: {
    type: String,
    required: true,
  },
  verification_token: {
    type: Number,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
  },
  jobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  proposals: [{ type: Schema.Types.ObjectId, ref: "Proposal" }],
  contracts: [{ type: Schema.Types.ObjectId, ref: "Contract" }],
});

employerSchema.post("findOneAndDelete", async function (emp) {
  if (emp.jobs.length) {
    await Job.deleteMany({ _id: { $in: emp.jobs } });
  }
  if (emp.proposals.length) {
    await Proposal.deleteMany({ _id: { $in: emp.proposals } });
  }
  if (emp.contracts.length) {
    await Contract.deleteMany({ _id: { $in: emp.contracts } });
  }
  if (emp.reviews.length) {
    await Review.deleteMany({ _id: { $in: emp.reviews } });
  }
});

const Employer = mongoose.model("Employer", employerSchema);

module.exports = Employer;
