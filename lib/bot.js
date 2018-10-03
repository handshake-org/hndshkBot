require('dotenv').config()
const irc = require('irc-framework')
const NickservInfoMiddleware = require('./NickservInfoMiddleware')
const Handshake = require('./Handshake')
const logger = require('../logger')
const config = require('../config/irc')

/**
 * The IRC bot
 */

const handshake = new Handshake()

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
    bot.notice(who, 'Welcome ' + who + " to the Project Handshake Channel. Are you here to validate your account? You will need to signup on the Handshake Website to receive a validation code. If you have one, just send me a private message with the command ':code YOUR_CODE' and I will attempt to validate your acccount. Note, your account must be over six months old.")

    bot.notice(who, 'The commands :help will give you more info and :coin? will check to see if your account is old enough to qualify.')
  }
})

bot.addListener('message', function (event) {
  try {
    // Only handle privmsgs. Not actions/notices/wallops/etc
    if (event.type !== 'privmsg') {
      return
    }

    logger.info('MESSAGE', {from: event.nick, to: event.target, text: event.message})

    if (event.target === bot.user.nick) {
      return handlePrivateMessage(event)
    } else {
      return handlePublicMessage(event)
    }
  } catch (err) {
    logger.error(err)
    throw err
  }
})
function sayHelp (to) {
  bot.say(to, "Handshakebot v2 -> Creating an account on Handshake.org no longer required!")
  bot.say(to, "This bot now supports submitting an address directly using the following commands")
  bot.say(to, ":postaddress [email, address] (save your address for the developer faucet. email required")
  bot.say(to, ":getaddress [] (lookup the address saved for your freenode account)")
  bot.say(to, ":check [] (see if your freenode account  qualifies for the faucet)")
  bot.say(to, ":code [code] (submit yourverification code from handshake.org (deprecated)")
}



async function handlePublicMessage (event) {
  let text = event.message
  let cmd = parseCmd(text)
  let from = event.nick

  switch (cmd) {
      case ':help': 
        bot.say(from, `Need help, ${from}? `)
        sayHelp(from)
        break;
      case ':check':
       checkUser(from)
        break
      case ':postaddress':
        bot.say(from, 'Please send your address as a PRVMSG!')
        break;
      case ':getaddress':
        bot.say(from, 'Please send your address as a PRVMSG!')
        break;
      case ':code':
        bot.say(from, 'Please send your code as a PRVMSG!')
        break
    //checkUserAndCode(from, text)
  }
}

async function handlePrivateMessage (event) {
  let text = event.message
  let from = event.nick
  let cmd = parseCmd(text)

  switch (cmd) {
    case ':check':
      checkUser(from)
      break;
    case ':code':
      checkUserAndCode(from, text)
      break;
    case ':help':
      sayHelp(from)
      break;
    case ':postaddress':
      let args = text.split(' ')
      let email = args[2]
      let address = args[3]
      bot.say(from, 'Ooh ok saving that away')
      let hello = await handshake.hello()
      logger.info(hello)
      bot.say(from, hello)
      break;
    case ':getaddress':
      bot.say(from, 'hmm let me get that for you')
      return getAddress(from, text)
      break;
  default:
    bot.say(from, 'Hmmm, did you mean to say please? Or :help :coin :getaddress :postaddress :code ?')
    sayHelp(from)
    break;
  }
}

function parseCmd (text) {
  words = text.split(' ')
  let cmd = null
  words.forEach(w => {
    if(/:/.test(w)) {
      cmd = w
    }
  })
  return cmd
}


// check user return T/F
// whatsMyAddr ->  getPubKey from TS
// heresMyAddr -> check user -> postPubKey to TS

/**
 * Verification / coin stuff
 */
async function postAddress (from, text) {
  let check = await checkUser(from)
  let address = text.split(' ')[1]
  if(check.qualified) {
    bot.say(from, 'POSTing your address now  ' + address)
    return true
  } else {
    return false
  }
}

async function getAddress (from, text) {
  let user = await bot.getNickInfo(from)
  logger.info("GETTING ADDRESS FOR " + user.nick)
  bot.say(from, 'GETTING YOUR ADDRESS NOW')
  return true
}

    
async function checkUserAndCode (from, text) {
  var code
  var commands = text.split(' ')
  if (commands[0] === ':code') {
    code = commands[1] || ''
    bot.say(from, 'Checking your account and validation code now.')

    bot.getNickInfo(from)
    .then(user => {
      let verify = verifyNickservUser(user);
      if (verify.qualifies) {
        logger.info('CALLING HANDSHAKE NOW', {user: user, code: code})
        return handshake.redeemCodeForUser(code, user)
      } else if (verify.message) {
        bot.say(user.nick, verify.message)
      }
    }).then(result => {
      if (!result) {
        return
      }

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

async function checkUser (from) {
  //bot.say(config.CHANNEL, 'Checking if ' + from + ' Qualifies for the airdrop')
  try {
    bot.say(from, 'Your account must be over 6 months old. Checking now.')
    const info = await bot.getNickInfo(from)
    const result = verifyNickservUser(info)
    if (result.message) {
      bot.say(from, result.message)
    }
    return result
  } catch (err) {
    logger.error('Error getting info' + err ? err.stack : '')
    bot.say(from, `I'm sorry, there was an issue with getting your info. Try again soon?`)
  }
}

function verifyNickservUser (user) {
  let result = {error: false, message: '', qualified: false};
  logger.info('Verifying user ', {user: user})
  if (!user.registered) {
    result.message = 'Your account must be registered to use this bot'
    logger.info('USER INVALID')
  } else if (user.registered < new Date(process.env.REGISTRATION_CUTOFF)) {
    result.message = 'Your account qualifies for the Handshake airdrop'
    result.qualified = true;
    logger.info('User Valid')
  } else {
    result.message = 'Sorry, your account is not old enough to qualify :('
    logger.info('USER INVALID')
  }
  return result
}

module.exports = {
  init: (callback) => {
    logger.info('Connecting...')
    bot.connect()
  }
}

// module.exports.init(()=>{});
