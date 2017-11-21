var db = require('../db');
var freenodeSchema = require('../schemas/freenode_account')


module.exports = {

  getVerifCode: ((data)=>{
    Joi.validate(data, freenodeAccountSchema)
    //return new Promise((resolve, reject) => {
    //resolve(true)
        /*

      const lookupCodeForAccount = {
        name: 'fetch freenode account and user',
        text: "SELECT * from freenodes where account = $1, JOIN users on freenode.user_id = users.id",
        values: [opts.freenode_account_name]
        */

    })

  }
}

