var request = require('request-promise')
var logger = require('../logger')
var config = require('../config/handshake')

module.exports = {

  redeemCodeForUser: (code, user) => {
    return new Promise((resolve, reject) => {
      var requestOptions  = {
        method: 'POST',
        url: config.HANDSHAKEAPI + '/qualification/redeem',
        headers: { 'X-API-TOKEN': config.HANDSHAKEKEY },
				body:	{ code: code, identifier: user.account },
				json: true
      }
      request(requestOptions)
      .then(data => {
        resolve({error: false, message: data.message, nick: user.nick, identifier: data.result.identifier})
      }).catch(e => {
        //logger.error(e)
        resolve({error: true, message: "Something went wrong", nick: user.nick, identifier: user.account})
      })
    })
   }
 }
