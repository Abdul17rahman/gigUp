const mongoose = require("mongoose");
const Schema = mongoose;

const proposalSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  employer: { type: Schema.Types.ObjectId, ref: "Employer" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Proposal = mongoose.model("Proposal", proposalSchema);

module.exports = Proposal;
