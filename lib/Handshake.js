require('dotenv').config({path: '.env'})
const rp = require('request-promise')
const logger = require('../logger')
const bounce = require('bounce')
const assert = require('assert')

/*
 * Lib for communicating with Handshake Token Server
 */


// :getaddress email (maybe also looks by nick?)
// :postaddress email address (validates address as second param)

class Handshake {

  async hello () {
    return "hello"
  }

  async redeemQualification (params) {
    const opts = {
      method: 'POST',
      uri: process.env.TOKEN_SERVER_API + '/qualification/redeem',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      body: {
        email: params.email,
        service: params.service,
        code: params.code,
        identifier: params.identifier
      },
      json: true
    }

    try {
      const response = await rp(opts)
      return {
        success: true,
        email: response.result.email,
        service: response.result.service,
        identifier: response.result.identifier
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR POST /qualification/redeem: ' + err.message)
      return {success: false, code: '', service: '', error: err}
    }
  }

  async postQualification (params) {

  // saves a freeenode qualification

    assert(typeof params.email === 'string')
    assert(typeof params.identifier === 'string')

    const opts = {
      method: 'POST',
      uri: process.env.TOKEN_SERVER_API + '/qualification',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      body: {
        email: params.email,
        service: "freenode",
        identifier: params.identifier
      },
      json: true
    }

    try {
      const response = await rp(opts)

      return {
        success: true,
        code: response.result.code,
        service: response.result.service,
        identifier: response.result.identifier,
        email: response.result.email
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR POST /qualification: ' + err.message)
      return {success: false, code: '', service: ''}
    }
  }

  // should require an email

  async postAddress (params) {
    const opts = {
      method: 'POST',
      uri: process.env.TOKEN_SERVER_API + '/pubkey',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      body: {
        email: params.email,
        key: params.key.trim()
      },
      json: true
    }

    try {
      const response = await rp(opts)
      return {
        success: true,
        email: response.email,
        key: response.key
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR POST /pubkey: ' + err.message)
      return {success: false, code: '', key: '', service: '', error: err}
    }
  }

  async getAddress (params) {
    const opts = {
      method: 'GET',
      uri: process.env.TOKEN_SERVER_API + '/pubkey',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      qs: {email: params.email},
      json: true
    }

    try {
      const response = await coinServerCall(opts, 'requesttime', {
        job: 'pubkeyget'
      })

      if (response.result[0]) {
        return {
          success: true,
          key: response.result[0].key,
          email: response.result[0].email
        }
      } else {
        return {success: false, key: '', email: ''}
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR GET /pubkey: ' + err.message)
      return {success: false, key: '', email: ''}
    }
  }
}

module.exports = Handshake

