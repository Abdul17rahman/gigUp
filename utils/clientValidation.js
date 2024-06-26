// This file contains client side validation with Joi
const Joi = require("joi");

const jobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  location: Joi.string().required(),
  duration: Joi.string().required(),
  numOfPos: Joi.number().min(1).required(),
})
  .required()
  .messages({
    "any.required": "Job data is missing.",
  });

const employerSchema = Joi.object({
  username: Joi.string().required(),
  company: Joi.string(),
  location: Joi.string().required(),
  email: Joi.string().required(),
  contact: Joi.string(),
  password: Joi.string().required(),
})
  .required()
  .messages({
    "any.required": "Employer data is missing.",
  });

const userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  bio: Joi.string().required(),
})
  .required()
  .messages({
    "any.required": "User data is missing.",
  });

module.exports = { jobSchema, employerSchema, userSchema };
