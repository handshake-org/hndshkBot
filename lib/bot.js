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
    bot.notice(who, 'Welcome ' + who + " to the Project Handshake Channel. Have you claimed a share of HNS yet? You now have two choices. You can signup on the Handshake Website to receive a validation code and send me a private message with the command ':code YOUR_CODE' to validate your acccount. Or you can generate your HNS wallet using this tool https://github.com/handshake-org/faucet-tool and submit the address directly to me using :postaddress. Note, your account must be over six months old.")

    bot.notice(who, 'The commands :help will give you more info and :check? will check to see if your account is old enough to qualify.')
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
    logger.error(err.message)
  }
})

function sayHelp (to) {
  bot.say(to, '<--------   Handshakebot v2  --------->')
  bot.say(to, 'You can now claim your share of HNS directly here on freenode.')
  bot.say(to, 'Follow these steps')
  bot.say(to, '1. Download this tool to generate a wallet -> https://github.com/handshake-org/faucet-tool')
  bot.say(to, '2. Send your email and full name with the :register command.')
  bot.say(to, '3. Send me your wallet address using the :postaddress command. Must use same email throughout.')

  bot.say(to, 'commands ------------------------------------------------------------------------------------ ')
  bot.say(to, ':register        [email address] [full name]       Required for KYC/AML purposes. If you have a Handshake.org account use that email.')
  bot.say(to, ':check       See if your freenode account qualifies for the faucet.')
  bot.say(to, ':postaddress         [email address] [wallet address]        Submit address to be granted coins by faucet.')
  bot.say(to, ':getaddress        Lookup the wallet address saved for your freenode account.')
  bot.say(to, ':code [code]       Submit yourverification code from handshake.org (deprecated).')
}

async function handlePublicMessage (event) {
  let text = event.message
  let cmd = parseCmd(text)
  let from = event.nick

  if(/help/.test(text)) { sayHelp(from) }

  switch (cmd) {
    case 'hndshktst:':
      bot.say(from, 'Hello ' + from + ', welcome to the handshake channel! Im here to dispense HNS coins to freenode users. Try the command help to learn more')
      break
    case ':help':
    case 'help:':
      sayHelp(from)
      break
    case ':check':
      await checkUser(from)
      break
    case ':postaddress':
      bot.say(from, 'Please send your command as a PRVMSG!')
      break
    case ':register':
      bot.say(from, 'Please send your command as a PRVMSG!')
      break
    case ':getaddress':
      bot.say(from, 'Please send your command as a PRVMSG!')
      break
    case ':code':
      bot.say(from, 'Please send your command as a PRVMSG!')
      break
  }
}

async function handlePrivateMessage (event) {
  let text = event.message
  let from = event.nick

  if(/help/.test(text)) { sayHelp(from) }

  try {
    let cmd = parseCmd(text)
    let user, response

    switch (cmd) {
      case ':check':
        checkUser(from)
        break
      case ':code':
        await checkUserAndCode(from, text)
        break

      case 'help':
      case ':help':
      case 'help:':
        sayHelp(from)
        break

      case ':register':
        await registerUser(from, text)
        break

      case ':postaddress':
        await postAddress(from, text)
        break

      case ':getaddress':
        bot.say(from, 'hmm let me get that for you')
        user = await bot.getNickInfo(from)
        response = await handshake.getAddress(user)
        if (response.success) {
          bot.say(from, ' Your Address: ' + response.address)
          bot.say(from, 'If this is not the address you submitted, please contact support@handshake.org immediately')
        } else {
          bot.say(from, `Sorry we could not find an address for this account (${from})`)
        }
        break
      default:
        bot.say(from, 'Hmmm, not recognized. Try :help for more info?')
        break
    }
  } catch (e) {
    logger.error(e)
    bot.say(from, 'Sorry something went wrong. See the :help command for info')
    return false
  }
}

function parseCmd (text) {
  let words = text.split(' ')
  let cmd = null
  words.forEach(w => {
    if (/:/.test(w)) {
      cmd = w
    }
  })
  return cmd
}

async function registerUser (from, text) {
  let args = text.split(' ')
  let email = args[1]
  let fullName = args.slice(2, args.length).join(' ')

  if (!/@/.test(email)) {
    bot.say(from, 'You must provide an email address as the first arg. See :help')
    return false
  }
  if (fullName.length < 5) {
    bot.say(from, 'You must provide your full name. Sorry for the inconvenience. See :help')
    return false
  }
  let user = await checkUser(from)
  if (!user.qualified) {
    bot.say(from, 'Sorry, your account is not old enough to qualify :(')
    return false
  }
  let response = await handshake.registerUser({user: user, email: email, full_name: fullName})
  if (response.success) {
    bot.say(from, `${response.identifier} registered successfully under the email ${response.email} and name ${response.full_name}`)
  } else {
    bot.say(from, response.error)
    return false
  }
}

async function postAddress (from, text) {
  let args = text.split(' ')
  let email = args[1]
  let address = args[2]
  if (!/@/.test(email)) {
    bot.say(from, 'You must provide an email address as the first arg. See :help')
    return false
  }
  if (address.slice(0, 2) !== 'hs' || address.length !== 42) {
    bot.say(from, 'You must provide a valid Handshake address as the second arg. See :help')
    return false
  }
  let user = await checkUser(from)
  if (user.qualified) {

    bot.say(from, 'Thank you. Saving that away')
    let response = await handshake.redeemUser({user: user, email: email, address: address})
    if (response.success) {
      bot.say(from, 'Address saved successfully for ' + response.account + ' under email ' + response.email)
    } else {
      bot.say(from, response.error)
      return false
    }
  } else {
    bot.say(from, 'Sorry, your account is not old enough to qualify :(')
  }
}

// check user return T/F
// whatsMyAddr ->  getPubKey from TS
// heresMyAddr -> check user -> postPubKey to TS

/**
 * Verification / coin stuff
 */

async function checkUserAndCode (from, text) {
  try {
    var commands = text.split(' ')
    let code = commands[1] || ''
    if(!code) {
      bot.say(from, "Sorry your command was malformed. A PRVMSG in the format ':code YOUR_CODE' should work")
      return false
    }
    bot.say(from, 'Checking your account and validation code now.')

    let result
    let user = await bot.getNickInfo(from)
    let verify = verifyNickservUser(user)
    if (verify.qualified) {
      logger.info('CALLING HANDSHAKE NOW', {user: user, code: code})
      result = await handshake.redeemQualification({code: code, service: 'freenode', identifier: user.account})
    } else if (verify.message) {
      bot.say(from, verify.message)
    }
    if (!result.success) {
      bot.say(from, 'Sorry but there was a problem validating your code. See :help or contact support@handshake.org')
    } else {
      bot.say(from, 'Code validated successfully. Thank you for participating.')
    }
    
  } catch(err) {
    logger.error('Error getting info' + err ? err.stack : '')
    bot.say(from, `I'm sorry, there was an issue with getting your info. Try again soon?`)
  }
}

async function checkUser (from) {
  // bot.say(config.CHANNEL, 'Checking if ' + from + ' Qualifies for the airdrop')
  try {
    bot.say(from, 'Your account must be over 6 months old. Checking now.')
    const info = await bot.getNickInfo(from)
    const result = verifyNickservUser(info)
    result.account = info.account
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
  let result = {error: false, message: '', qualified: false}
  logger.info('Verifying user ', {user: user})
  if (!user.registered) {
    result.message = 'Your account must be registered to use this bot'
    logger.info('USER INVALID')
  } else if (user.registered < new Date(process.env.REGISTRATION_CUTOFF)) {
    result.message = 'Your account qualifies for the Handshake airdrop'
    result.qualified = true
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
