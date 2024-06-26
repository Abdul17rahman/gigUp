const mongoose = require("mongoose");
const Schema = mongoose;

const proposalSchema = new Schema({
  status: {
    type: String,
    enums: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
