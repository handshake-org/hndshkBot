// convinence seeder methods
var db = require('../../db/');
var fnSchema = require('../../schemas/freenode');

const dbHelper = {

  mockFreeNodeAccount: ()=>{
 
        account: 'hndshktst',
        nicks: ['handshake, hndshktst'],
        registered: Date.now(),
      }


  seedFakeUser: ()=>{
    return true;

  },

  seedFakeFreeNodeUser: ()=>{

  }
}

module.exports =  dbHelper;
