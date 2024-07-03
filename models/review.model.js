const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewsSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  jobTitle: { type: String, required: true },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  employer: { type: Schema.Types.ObjectId, ref: "Employer" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Review = mongoose.model("Review", reviewsSchema);

module.exports = Review;
