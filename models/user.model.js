const mongoose = require("mongoose");
const { Schema } = mongoose;
const Proposal = require("./proposal.model");
const Contract = require("./contract.model");
const Review = require("../models/review.model");

const userSchema = new Schema({
  username: {
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
  bio: {
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
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  contracts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Contract",
    },
  ],
  proposals: [
    {
      type: Schema.Types.ObjectId,
      ref: "Proposal",
    },
  ],
});

userSchema.post("findOneAndDelete", async function (user) {
  if (user.proposals.length) {
    await Proposal.deleteMany({ _id: { $in: user.proposals } });
  }
  if (user.contracts.length) {
    await Contract.deleteMany({ _id: { $in: user.contracts } });
  }
  if (user.reviews.length) {
    await Review.deleteMany({ _id: { $in: user.contracts } });
  }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
