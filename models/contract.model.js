const mongoose = require("mongoose");
const Schema = mongoose;

const contractSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  employer: { type: Schema.Types.ObjectId, ref: "Employer" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
