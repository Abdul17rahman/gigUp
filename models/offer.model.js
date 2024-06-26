const mongoose = require("mongoose");
const Schema = mongoose;

const offerSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: "Job" },
  employer: { type: Schema.Types.ObjectId, ref: "Employer" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
