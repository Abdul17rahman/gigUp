const mongoose = require("mongoose");
const { Schema } = mongoose;

const contractSchema = new Schema({
  status: {
    type: String,
    enum: ["Running", "Completed"],
  },
  comment: {
    type: String,
  },
  proposal: { type: Schema.Types.ObjectId, ref: "Proposal" },
});

const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;
