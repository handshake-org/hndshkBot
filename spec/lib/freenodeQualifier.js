var subject = require('../../lib/freenodeQualifier')
var db = require('../../db');
var dbHelper = require('../support/db_helper')

/*
 * freenode.getVerifCode (nick, account,name)
 * //creates if none exists
 * returns false if registration date not valie
 *
 * freenode.regenerateCode
 */

describe('freenode.getVerifCode()', (()=> {

  it('throws an error if passed an invalid object', (()=>{
    var badSchema = {
      account: 'hndshktst',
      foo: 'bar',
      nicks: 'oops i should be an array'
    }
    expect(subject.getVerifCode(badSchema)).not.toThrow()
    done();
  }))
}))


  describe('for first time', (()=>{

    var freenodeUser;

    beforeEach((done)=>{
      freenodeUser  = dbHelper.mockFreenodeUser();
             done()
    })

    it('should generate and save a valid VerifCode for the freenode account', ((done) =>{
      subject.getVerifCode(freenodeUser).then({
        return db.
      done();
    }))

    it('should save a freenode account with the proper attrs', ((done)=> {
      done();
      /*
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
      */
    }))
  }))

  describe('for a returning user', (()=>{

    it('should return the already generated code', ((done) =>{
      done();


    }))
  }))
}))
