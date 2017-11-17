var irc = require('../submodules/irc/lib/irc');
var logger = require('../logger');
var config = require('../config/irc');

//var freeNodeValidator.validateAccount(account_name);
// returns code


var bot = new irc.Client(config.SERVER, config.BOTNAME, {
  channels: [config.CHANNEL],
  autoConnect: false,
  autoRejoin: false,
  sasl: true,
  password: config.PASSWORD,
  realName: 'Project Handshake Test Bot',
  userName: config.BOTNAME,
  showErrors: true,
  debug: false,
  nickMod: false,
  floodProtection: true,
  floodProtectionDelay: 500


})

//listeners

bot.addListener('error', function(msg) {
  logger.error(JSON.stringify(msg));
})

bot.addListener('registered', function(message) {
  logger.info('BOT: REGISTERED')
})

bot.addListener('join', function(channel, who) {
  // Welcome user to channel
  if(who != config.BOTNAME) {
    bot.say(who, "Welcome " + who + " to the Project Handshake Channel. Do you want some tokens? If so, just send me a private message and remember to say 'please'.")
    bot.say(who, "The commands :help, :tokens, and :tokensplease also work.")
  }
})

bot.addListener('message#', function(from, to, text, message) {
  // listen for tokens commands
  logger.info("mESSAGE", {from: from, to: to, text: text, message: message})
  if(text.match(/:help/)) {
    bot.say(from, "Need help? Send me a PRVMSG with the word 'please'. If you qualify for the token airdrop, I will generate a validation code for you")
  } else if(text.match(/:token/)) {
    checkUser(from)
  }
})

bot.addListener('pm', function(from, message) {
 if(message.match(/please/)) {
  checkUser(from);
 } else {
   bot.say(from, "Hmmm, did you mean to say please? Or :help?")
 }
})

var checkingNick = '';
var currentUser = {};

function checkUser(from) {
  bot.say(config.CHANNEL, "Checking if " + from + "Qualifies for the airdrop")
  if(!checkingNick) {
    checkingNick = from;
    bot.say(from, "Your account must be over 6 months old. Checking now.")
    bot.send('/msg nickserv info ' + from)
  } else {
    bot.say(from, "Hang on, checking another user at the moment")
    //bot.say(from, "I'm sorry, do you want some HandShake Tokens? If so, just say 'please'")
  }
}

bot.addListener('notice', function(nick,to, text, notice) {
  parseNotices(nick, to, text, notice)
})

function resetCurrentUser() {
  currentUser = {};
  checkingNick = false;
}

function parseNotices(nick, to, text, notice) {

  var words = text.split(' ');
  switch(words[0]) {
    case "***":
      break;
    case "Information":
      var nick = words[2].replace(/\u0002/g, '')
      var account = words[4].slice(0,-1)
      if(nick == checkingNick) {
        currentUser.account = account,
        currentUser.nick = nick;
      } else {
        logger.error("BOT IS CONFUSED")
        resetCurrentUser();
        return false;
      }
      break;
    case "Nicks":
      currentUser.nickList = text.split(':')[1].trim().split(' ') 
      break;
    case "Registered":
      currentUser.registered = new Date(text.split(':')[1].split('(')[0])
      break;
    case "Flags":
      if(currentUser.account && currentUser.registered) {
        logger.info("BOT: got info", {user: currentUser})
        verifyUser(Object.assign({},currentUser))
        resetCurrentUser();
      }
      break;
  }
}

function verifyUser(user) {
  bot.say(user.nick, "We are checking your nick now")
  logger.info("Verifying user ", {user: user})
  if(user.registered < new Date("2017 05 09")) {
    grantTokens(user.nick);
  } else {
    bot.say(user.nick, "Sorry no tokens for you")
    bot.say(user.nick, "According to nickServ info, you registered " + user.nick + " on " + user.registered)
  }
  resetCurrentUser();
}

function grantTokens(nick) {
  logger.info('granting Tokens', {user: nick})

  bot.say(nick, "Your nick is valid! You get tokens Now!")
  // omg send tokens 
}


module.exports = {
  hello: ()=>{
    return true;
  },

  init: (callback)=> {

    bot.connect(1, function(data) {
      logger.info("BOT: Connecting to Server ", {data, data})

        bot.join(config.CHANNEL, '', function() {
          logger.info("BOT: Joined Channel" + config.CHANNEL)
          callback();
        })
    })
  }
};


