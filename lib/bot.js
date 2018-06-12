require('dotenv').config()
var irc = require('irc-framework')
var NickservInfoMiddleware = require('./NickservInfoMiddleware')
var handshake = require('./Handshake')
var logger = require('../logger')
var config = require('../config/irc')

/**
 * The IRC bot
 */

var bot = new irc.Client({
  host: config.SERVER,
  port: config.PORT,
  tls: config.TLS,
  nick: process.env.IRC_BOTNAME,
  password: process.env.IRC_PASSWORD,
  gecos: 'Project Handshake Bot',
  username: process.env.IRC_BOTNAME
})
bot.use(NickservInfoMiddleware())

bot.on('raw', (event) => {
  if (config.DEBUG) {
    logger.info({event: event}, 'IRC ' + event.from_server ? '[S]' : '[C]', event.line)
  }
})

bot.addListener('error', function (msg) {
  logger.error(JSON.stringify(msg))
})

bot.addListener('registered', function () {
  logger.info('BOT: REGISTERED')
  if (config.CHANNEL) {
    bot.join(config.CHANNEL)
  }
})

bot.addListener('join', function (event) {
  let who = event.nick
  // Welcome user to channel
  if (who !== bot.user.nick) {
    bot.say(who, 'Welcome ' + who + " to the Project Handshake Channel. Are you here to validate your account? You will need to signup on the Handshake Website to receive a validation code. If you have one, just send me a private message with the command ':code YOUR_CODE' and I will attempt to validate your acccount. Note, your account must be over six months old.")

    bot.say(who, 'The commands :help will give you more info and :tokens? will check to see if your account is old enough to qualify.')
  }
})

bot.addListener('message', function (event) {
  // Only handle privmsgs. Not actions/notices/wallops/etc
  if (event.type !== 'privmsg') {
    return
  }

  logger.info('MESSAGE', {from: event.nick, to: event.target, text: event.message})

  if (event.target === bot.user.nick) {
    handlePrivateMessage(event)
  } else {
    handlePublicMessage(event)
  }
})

var helpText = "If you would like to redeeem your validation code from the Handshake Website, send me a PRVMSG in the format ':code YOUR_CODE' and I will attempt to validate it for you. If you do not yet have an account on https://handshake.org go and create one first to get a validation code."

function handlePublicMessage (event) {
  let text = event.message
  let from = event.nick
  if (text.match(/:help/)) {
    bot.say(from, `Need help, ${from}? ` + helpText)
  } else if (text.match(/:token/)) {
    checkUser(from)
  } else if (text.match(/:code/)) {
    bot.say(from, 'Please send your code as a PRVMSG!')
    checkUserAndCode(from, text)
  }
}

function handlePrivateMessage (event) {
  let text = event.message
  let from = event.nick
  if (text.match(/:token/)) {
    checkUser(from)
  } else if (text.match(/:code/)) {
    checkUserAndCode(from, text)
  } else if (text.match(/:help/)) {
    bot.say(from, helpText)
  } else {
    bot.say(from, 'Hmmm, did you mean to say please? Or :help? Or :token?')
  }
}

/**
 * Verification / coin stuff
 */

function checkUserAndCode (from, text) {
  var code
  var commands = text.split(' ')
  if (commands[0] === ':code') {
    code = commands[1]
    bot.say(from, 'Checking your account and validation code now.')

    bot.getNickInfo(from)
    .then(user => {
      if (verifyUser(user)) {
        logger.info('CALLING HANDSHAKE NOW', {user: user, code: code})
        return handshake.redeemCodeForUser(code, user)
      }
    }).then(result => {
      if (result.error) {
        bot.say(result.nick, 'Sorry but there was a problem validating your code.')
      } else {
        bot.say(result.nick, result.message)
      }
    })
    .catch(err => {
      logger.error('Error getting info' + err ? err.stack : '')
      bot.say(from, `I'm sorry, there was an issue with getting your info. Try again soon?`)
    })
  } else {
    bot.say(from, "Sorry your command was malformed. A PRVMSG in the format ':code YOUR_CODE' should work")
  }
}

function checkUser (from) {
  bot.say(config.CHANNEL, 'Checking if ' + from + ' Qualifies for the airdrop')
  bot.say(from, 'Your account must be over 6 months old. Checking now.')
  bot.getNickInfo(from)
    .then(verifyUser)
    .catch(err => {
      logger.error('Error getting info' + err ? err.stack : '')
      bot.say(from, `I'm sorry, there was an issue with getting your info. Try again soon?`)
    })
}

function verifyUser (user) {
  bot.say(user.nick, 'We are checking your nick now')
  logger.info('Verifying user ', {user: user})
  if (user.registered < new Date(process.env.REGISTRATION_CUTOFF)) {
    bot.say(user.nick, 'Your Account qualifies! Now head over to the Handshake website and Signup to get a validation code.')
    logger.info('User Valid')
    return true
  } else {
    bot.say(user.nick, 'Sorry your account was created too recently.')
    bot.say(user.nick, 'According to nickServ info, you registered ' + user.nick + ' on ' + user.registered)
    logger.info('USER INVALID')
    return false
  }
}

module.exports = {
  init: (callback) => {
    logger.info('Connecting...')
    bot.connect()
  }
}

// module.exports.init(()=>{});
