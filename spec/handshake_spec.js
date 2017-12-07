var handshake = require('../lib/handshake')

//var tempValidCode ='/NJs8fy0kqiVKP1+nMPHVB3K0MWX2Pnc/reEZ959Xz8Wvtyu1DyrrxSj8r+tg72c'
//var tempValidCode = '1zCkdm1XT22lM6Qup3xqGwV3vqfkmernUfJYXWKPzE2ToQIJ2kaZvFm+Osu8tUaY'
var tempValidCode = 'N2usvlLE8PNJQC9SwM+lFaiadt+o4KBkbu16ygqKjCyWlw9pexs4lwUdpQ1jOVh4'


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

  var valid = {
    code: tempValidCode,
    identifier: 'doEsntmatterherR'
  }


  it('successfully POSTS a code and identifier to the API', (done) => {
    handshake.redeemCodeForUser(valid.code, valid.identifier)
    .then(result => {
      expect(result.message).toEqual("success")
      expect(result.identifier).toEqual(valid.identifier.toLowerCase())
      expect(result.error).toEqual(false)
      done()
    }).catch(err => {
      console.log(err)
      done(err)
    })
  })
})



