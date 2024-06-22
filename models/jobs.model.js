const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    type: String,
    required: true,
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
    default: "active",
  },
  numOfPos: {
    type: Number,
  },
  created_at: {
    type: String,
    default: Date.now().toString(),
  },
});

const Job = mongoose.model("Job", jobsSchema);

module.exports = Job;
