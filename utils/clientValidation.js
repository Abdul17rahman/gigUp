// This file contains client side validation with Joi
const Joi = require("joi");

const jobSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  employer: Joi.string().required(),
  location: Joi.string().required(),
  duration: Joi.string().required(),
  numOfPos: Joi.number().min(1).required(),
}).required();

module.exports = jobSchema;
