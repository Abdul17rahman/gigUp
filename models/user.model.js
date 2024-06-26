const mongoose = require("mongoose");
const { Schema } = mongoose;

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
      ref: "Proposa",
    },
  ],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
