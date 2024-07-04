const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Proposal = require("./proposal.model");
const Contract = require("./contract.model");

const jobsSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  employer: {
    type: Schema.Types.ObjectId,
    ref: "Employer",
  },
  location: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "taken"],
    default: "active",
  },
  numOfPos: {
    type: Number,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  proposals: [
    {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
    },
  ],
  contract: {
    type: Schema.Types.ObjectId,
    ref: "Contract",
  },
});

jobsSchema.post("findOneAndDelete", async function (job) {
  if (job.proposals.length) {
    await Proposal.deleteMany({ _id: { $in: job.proposals } });
  }
  if (job.contract) {
    await Proposal.findByIdAndDelete(job.contract);
  }
});

const Job = mongoose.model("Job", jobsSchema);

module.exports = Job;
