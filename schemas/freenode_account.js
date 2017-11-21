// represents a users freenode account
// also stores the verif_code they receive from the bot
// TODO use this schema in the bot as well.

const Joi = require('joi');

const schema = Joi.object().keys({
  user_id:  Joi.integer(),
  account:  Joi.string().required(),
  nicks:    Joi.array().required(),
  verif_code:     Joi.string().alphanum(),
  registered_at: Joi.date().required(),
  verified_at:  Joi.date(),
  created_at: Joi.date().default([Date.now()])
  updated_at: Joi.date(),
})

module.exports = schema;


