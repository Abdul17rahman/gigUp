const mongoose = require("mongoose");
const { Schema } = mongoose;

const proposalSchema = new Schema({
  status: {
    type: String,
    enums: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  price: {
    type: Number,
    required: true,
    min: [1],
  },
  period: {
    type: String,
    enum: ["fixed", "hr", "day", "wk", "mo"],
    default: "fixed",
  },
  cover: {
    type: String,
    required: true,
  },
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
