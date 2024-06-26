const mongoose = require("mongoose");
const Schema = mongoose;

const reviewsSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  employer: { type: Schema.Types.ObjectId, ref: "Employer" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
});

const Review = mongoose.model("Review", reviewsSchema);

module.exports = Review;
