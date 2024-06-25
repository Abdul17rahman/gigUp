const jobSchema = require("../utils/clientValidation");
const AppEror = require("../utils/AppError");

function validateJob(req, res, next) {
  // Extract an error object from validation.
  const { error } = jobSchema.validate(req.body.job);
  if (error) {
    // Extract message from the error object
    const msg = error.details.map((el) => el.message).join(",");
    throw new AppEror(msg, 400);
  } else {
    next();
  }
}

module.exports = validateJob;
