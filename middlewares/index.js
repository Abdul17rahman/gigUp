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

function authenticateUser(req, res, next) {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Please kindly login.");
    return res.redirect("/users/login");
  }
  next();
}

function authenticateEmp(req, res, next) {
  if (!req.session.employer) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Please kindly login.");
    return res.redirect("/employers/login");
  }
  next();
}

// Middleware to check if the user is the owner of the resource
function isUser(req, res, next) {
  if (req.session.user && req.session.user._id === req.params.id) {
    return next();
  }
  req.flash("error", "You do not have permission to do that.");
  res.redirect("back");
}

// Middleware to check if the employer is the owner of the resource
function isEmployer(req, res, next) {
  if (req.session.employer && req.session.employer._id === req.params.id) {
    return next();
  }
  req.flash("error", "You do not have permission to do that.");
  res.redirect("back");
}

module.exports = {
  validate,
  authenticateUser,
  authenticateEmp,
  isUser,
  isEmployer,
};
