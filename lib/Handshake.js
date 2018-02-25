require('dotenv').config()
var request = require('request-promise')

module.exports = {

  redeemCodeForUser: (code, user) => {
    return new Promise((resolve, reject) => {
      var requestOptions = {
        method: 'POST',
        url: process.env.TOKEN_SERVER_API + '/qualification/redeem',
        headers: { 'X-API-TOKEN': process.env.TOKEN_SERVER_KEY },
        body: { code: code, identifier: user.account },
        json: true
      }
      request(requestOptions)
      .then(data => {
        resolve({error: false, message: data.message, nick: user.nick, identifier: data.result.identifier})
      }).catch(e => {
        // logger.error(e)
        resolve({error: true, message: 'Something went wrong', nick: user.nick, identifier: user.account})
      })
    })
  }
}
