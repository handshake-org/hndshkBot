var subject = require('../../lib/freenodeUserCreator')
var db = require('../../db');
var dbHelper = require('../support/db_helper')

describe('freenodeUserCreator.checkUser()', (()=> {

  describe('upon first contact', (()=>{
    var count, after_count;
    beforeEach((done)=>{
      dbHelper.seedFakeUser();
      db.query("SELECT count(*) from Users").then((res)=>{
        count = res.rows[0].count
        done();
      })
    })


    it('should check the User', ((done)=> {
      var userDeets = { account: 'hndshktst', nick:' yo', registered: Date.now()}
      console.log(subject);
      subject.checkUser(userDeets)
        .then((result) => {
          return db.query("SELECT count(*) from Users")
      }).then((res)=>{
        after_count = res.rows[0].count
        expect(after_count).toEqual(count+1)
        done();
      })
    }))
  }))
}))
