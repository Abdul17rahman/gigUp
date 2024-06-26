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
  offers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Offer",
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
