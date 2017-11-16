require('dotenv').config()

const { Pool } = require('pg')
const pool = new Pool()
const logger = require('../logger')

module.exports = {
  query: (text, params) => {
      return pool.query(text, params)
  },

  getClient: (callback) => {
    pool.connect((err, client, done) => {
      callback(err, client, done)
    })
  }
}
