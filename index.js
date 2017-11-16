'use strict'

var dotenv = require('dotenv');
var winston = require('winston');

var irc = require('./submodules/irc/lib/irc');

dotenv.config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error'}),
    new winston.transports.File({ filename: 'combined.log',})
  ]
})

if(process.env.NODE_ENV != 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}


var bot = new irc.Client(process.env.SERVER, process.env.BOTNAME, {
  channels: [process.env.CHANNEL],
  autoConnect: false,
  autoRejoin: false,
  sasl: true,
  password: process.env.PASSWORD,
  realName: 'Project Handshake Test Bot',
  userName: process.env.BOTNAME,
  showErrors: true,
  debug: true,

})


bot.connect(1, function(data) {
  // logger.info("Connecting to Server data: "+ JSON.stringify(data))
  //bot.send("/msg Nickserv identify " + process.env.PASSWORD)
  logger.info("%%%%%%%%%%%%%%%%%%% Connected")

  /*
    bot.join(process.env.CHANNEL, '', function() {
      logger.info("attempting to join channel " + process.env.CHANNEL)
    })
  */
})


  /*
var user = {};

function grantTokens(nick) {
  logger.log('granting tokens to ' + nick)
  // omg send tokens 
}

function verifyUser() {
  bot.say(user.nick, "We are checking your nick now")
  if(user.registered < new Date("2017 05 09")) {
    bot.say(user.nick, "Your nick is valid! You get tokens Now!")
    grantTokens(user.nick);
  } else {
    bot.say(user.nick, "Sorry no tokens for you")
    bot.say(user.nick, "According to nickServ info, you registered " + user.nick + " on " + user.registered)
  }
  resetUser();
}

function resetUser() {
  user = {};
}

bot.addListener('notice', function(nick,to, text, notice) {

  var words = text.split(' ');
  switch(words[0]) {
    case "Information":
      user.nick = words[2].replace(/\u0002/g, '')
      break;
    case "Registered":
      user.registered = new Date(text.split(':')[1].split('(')[0])
      break;
    case "Flags":
      if(user.nick && user.registered) {
        verifyUser();
      } else {
        bot.say(user.nick, "Sorry, something went wrong, please try asking again")
      }
      break
  }
})

bot.addListener('pm', function(from, message) {
  if(!!message.match(/please/)) {
    bot.say(from, "Your account must be over 6 months old.")
    bot.send('/msg nickserv info ' + from)
  } else {
    bot.say(from, "Hi, do you want some HandShake Tokens? If so, just say 'please'")
  }
})
*/

bot.addListener('error', function(msg) {
  logger.error(JSON.stringify(msg));
})

bot.addListener('registered', function(message) {
  //bot.say(process.env.CHANNEL, "Im here!");
  logger.info('$$$$$ REGISTERED')
})

  /*
bot.addListener('join', function(channel, who) {
  // Welcome user to channel
  if(who != process.env.botName) {
    bot.say(channel, "Welcome " + who + " to the Project Handshake Channel. Do you want some tokens? If so, just send me a private message, and remember to say 'please'")
  }
})
*/

