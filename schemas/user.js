const Joi = require('joi');

const schema = Joi.object().keys({
  name: Joi.string().alphanum().min(3).required(),
  email: Joi.string().email(),
  password: Joi.regex(/^[a-zA-Z0-9]{3,30}$/), 
  created_at: Joi.date(),
  updated_at: Joi.date(),
})

module.exports = schema;


