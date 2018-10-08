require('dotenv').config()
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
    return 'hello'
  }

  async registerUser (params) {
    try {
      let qual = await this.postQualification({
        email: params.email,
        service: 'freenode',
        identifier: params.user.account,
        full_name: params.full_name
      })
      return qual
    } catch (e) {
      logger.error(e)
      return {success: false, error: 'Something went wrong. Perhaps you already registered with this account?'}
    }
  }

  async getQualifications (params) {
    const opts = {
      method: 'GET',
      uri: process.env.TOKEN_SERVER_API + '/qualifications',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      qs: {
        email: params.email
      },
      json: true
    }
    try {
      const response = await rp(opts)
      return {
        success: true,
        email: response.result.email,
        qualifications: response.result.qualifications
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER CONNECTION ERROR GET /qualifications: ' + err.message)
      return {success: false, qualifications: [], service: '', error: err}
    }
  }

  async redeemUser (params) {
    try {
      let response = await this.getQualifications({email: params.email})

      let freenode = response.qualifications.filter(q => { return q.service === 'freenode' })[0]

      let redeemed = await this.redeemQualification({
        email: params.email,
        service: 'freenode',
        code: freenode.code,
        identifier: params.user.account
      })

      if (!redeemed.success) {
        return { success: false, error: 'You need to register before submitting an address.' }
      }

      let address = await this.postAddress({email: params.email, address: params.address})

      if (!address.success) {
        return { success: false, error: 'Something went wrong. Did you register first? See :help' }
      }

      return {success: true, address: address.address, email: address.email, account: params.user.account}
    } catch (e) {
      logger.error(e)
      return {success: false, error: e}
    }
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
        service: 'freenode',
        identifier: params.identifier,
        full_name: params.full_name || null
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
        email: response.result.email,
        redeemed_at: response.result.redeemed_at,
        full_name: response.result.full_name
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR POST /qualification: ' + err.message)
      return {success: false, error: 'Something went wrong. Have you tried to register with this freenode account before? See :help or contact support@handshake.org'}
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
        key: params.address.trim()
      },
      json: true
    }

    try {
      const response = await rp(opts)
      if (response.key) {
        return {
          success: true,
          email: params.email,
          address: response.key
        }
      } else { throw new Error(response.error) }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR POST /pubkey: ' + err.message)
      return {success: false, code: '', address: '', service: '', error: err, email: null}
    }
  }

  async getAddress (user) {
    const opts = {
      method: 'GET',
      uri: process.env.TOKEN_SERVER_API + '/pubkey',
      headers: {
        'Content-Type': 'application/json',
        'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
      },
      qs: {email: null, freenode: user.account},
      json: true
    }

    try {
      const response = await rp(opts)

      // code smell - key not renamed to address
      if (response.result[0]) {
        return {
          success: true,
          address: response.result[0].key,
          email: response.result[0].email
        }
      } else {
        return {success: false, address: '', email: ''}
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error('TOKEN SERVER ERROR GET /pubkey: ' + err.message)
      return {success: false, address: '', email: ''}
    }
  }
}

module.exports = Handshake
