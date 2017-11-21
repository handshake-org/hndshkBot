const db = require('./index')
const logger = require('../logger')

//Setting up tables
const dropAll = "DROP TABLE IF EXISTS users";

const createUserTable = "CREATE TABLE users (name varchar(60), email varchar(60), password varchar(255), created_at timestamp default current_timestamp, updated_at timestamp)";

const createFreeNodeTable = "CREATE TABLE freenodes (user_id integer, account varchar(60), nicks text[], registered_at timestamp, code varchar(255), verified_at timestamp, created_at timestamp default current_timestamp, updated_at timestamp)"

module.exports = {
  tearDownRebuild: () => {
    // omg be careful this drops the whole DB
    if(process.env.NODE_ENV != 'production') {
      return new Promise((resolve,reject)=>{
        db.query(dropAll)
        .then(res => {
          logger.info('Tables Dropped')
          return db.query(createUserTable)
        }).then(res => {
          logger.info("users created")
          return db.query(createFreeNodeTable)
        }).then(res => {
          logger.info('freenodes created')
          resolve(true)
        }).catch(e => {
          logger.error(e.stack)
          reject(e)
        })
      })
    }
  }
}

