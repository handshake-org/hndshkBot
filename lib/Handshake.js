var request = require('request')
var logger = require('./logger')

module.exports = {

  redeemCodeForUser: (code, user) => {
    logger.info('Checking code: ' + code)
    logger.info('From User: ' + user)
    return new Promise((resolve, reject) => {
      request()
      resolve(true)
    })
  }
}
