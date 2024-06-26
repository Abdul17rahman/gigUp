const mongoose = require("mongoose");
const Job = require("./jobs.model");

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
  contracts: [{ type: Schema.Types.ObjectId, ref: "Contract" }],
});

employerSchema.post("findOneAndDelete", async function (emp) {
  if (emp.jobs.length) {
    await Job.deleteMany({ _id: { $in: emp.jobs } });
  }
});

const Employer = mongoose.model("Employer", employerSchema);

module.exports = Employer;
