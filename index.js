'use strict'
var logger = require('./logger')

require('dotenv').config()

var bot = require('./lib/bot')

logger.info('Hello! Attempting to connect to chat.freenode.net')

bot.init(() => {
  logger.info('Connected and Ready')
})

/*
 * User validates true -
 * check for existing account
 * lookup/save user, lookup/save freenode
 * respond with code
 *
 * User requests code -
 * lookup/user, lookup freenode,
 * respond with code

*/
