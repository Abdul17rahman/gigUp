const {
  jobSchema,
  employerSchema,
  userSchema,
} = require("../utils/clientValidation");
const AppEror = require("../utils/AppError");

// function validateJob(req, res, next) {
//   // Extract an error object from validation.
//   const { error } = jobSchema.validate(req.body.job);
//   if (error) {
//     // Extract message from the error object
//     const msg = error.details.map((el) => el.message).join(",");
//     throw new AppEror(msg, 400);
//   } else {
//     next();
//   }
// }

// function validateEmployer(req, res, next) {
//   const { error } = employerSchema.validate(req.body.emp);
//   if (error) {
//     // Extract message from the error object
//     const msg = error.details.map((el) => el.message).join(",");
//     throw new AppEror(msg, 400);
//   } else {
//     next();
//   }
// }

// function validateUser(req, res, next) {
//   const { error } = userSchema.validate(req.body.emp);
//   if (error) {
//     // Extract message from the error object
//     const msg = error.details.map((el) => el.message).join(",");
//     throw new AppEror(msg, 400);
//   } else {
//     next();
//   }
// }

function validate(name) {
  if (!name) throw new AppEror("There's nothing to validate", 404);
  return function (req, res, next) {
    let schema = "";
    let data = {};
    if (name === "user") {
      schema = userSchema;
      data = req.body.user;
    } else if (name === "emp") {
      schema = employerSchema;
      data = req.body.emp;
    } else if (name === "job") {
      schema = jobSchema;
      data = req.body.job;
    }
    const { error } = schema.validate(data);
    if (error) {
      // Extract message from the error object
      const msg = error.details.map((el) => el.message).join(",");
      throw new AppEror(msg, 400);
    } else {
      next();
    }
  };
}

module.exports = { validate };
