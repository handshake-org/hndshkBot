var handshake = require('../lib/handshake')

//var tempValidCode ='/NJs8fy0kqiVKP1+nMPHVB3K0MWX2Pnc/reEZ959Xz8Wvtyu1DyrrxSj8r+tg72c'
//var tempValidCode = '1zCkdm1XT22lM6Qup3xqGwV3vqfkmernUfJYXWKPzE2ToQIJ2kaZvFm+Osu8tUaY'
var tempValidCode = "/vEg6gopN+zkQD5pEUIa5sYHt9BpS+mXNzqZJ3TLP+8tpSEVO+CNjjWIoVtgBIPL"

describe('redeeming a qualification with the  HANDSHAKEAPI', () => {

  it('handles the error response gratefully', (done) => {
    handshake.redeemCodeForUser('fake code', {account: 'blah'})
    .then(result => {
      expect(result.message).toEqual("Something went wrong")
      expect(result.error).toEqual(true)
      done()
    }).catch(err => {
      if(err) { throw err }
      console.log(err)
      done(err)
    })
  })

  var freenodeAccount= {
    account: 'doEsntmatterhere', nick: "my real nick", registered: Date.now()
  }


  it('successfully POSTS a code and identifier to the API', (done) => {
    handshake.redeemCodeForUser(tempValidCode, freenodeAccount)
    .then(result => {
      console.log(result)
      expect(result.message).toContain("successfully")
      expect(result.identifier).toEqual(freenodeAccount.account.toLowerCase())
      expect(result.error).toEqual(false)
      done()
    }).catch(err => {
      console.log(err)
      done(err)
    })
  })
})



