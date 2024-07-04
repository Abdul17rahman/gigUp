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

const reviewSchema = Joi.object({
  rating: Joi.number(),
  text: Joi.string().required(),
})
  .required()
  .messages({
    "any.required": "Review data is missing.",
  });

const proposalSchema = Joi.object({
  price: Joi.number().required().min(1),
  period: Joi.string(),
  cover: Joi.string().required(),
})
  .required()
  .messages({
    "any.required": "Proposal data is required.",
  });

module.exports = {
  jobSchema,
  employerSchema,
  userSchema,
  reviewSchema,
  proposalSchema,
};
