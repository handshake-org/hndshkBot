var irc = require('/work/personal/irc-framework/');
var NickservInfoMiddleware = require('./NickservInfoMiddleware');
var logger = require('../logger');
var config = require('../config/irc');

/*
logger = {
  info: console.log.bind(console),
  error: console.log.bind(console),
};
var config = {
  SERVER: 'irc.freenode.net',
  PORT: 6667,
  TLS: false,
  BOTNAME: 'shakyprawn',
  CHANNEL: '#prawnsalad',
  PASSWORD: '',
  NICKINFOTIMEOUT: 20000,
  DEBUG: false,
};
*/

//var freeNodeValidator.validateAccount(account_name);
// returns code


/**
 * The IRC bot
 */

var bot = new irc.Client({
  host: config.SERVER,
  port: config.PORT,
  tls: !!config.TLS,
  nick: config.BOTNAME,
  password: config.PASSWORD,
  gecos: 'Project Handshake Test Bot',
  username: config.BOTNAME,
});
bot.use(NickservInfoMiddleware());

bot.on('raw', (event) => {
  if (config.DEBUG) {
    logger.info('IRC ' + event.from_server ? '[S]' : '[C]', event.line);
  }
});

bot.addListener('error', function(msg) {
  logger.error(JSON.stringify(msg));
});

bot.addListener('registered', function() {
  logger.info('BOT: REGISTERED')
  if (config.CHANNEL) {
    bot.join(config.CHANNEL)
  }
});

bot.addListener('join', function(event) {
  let who = event.nick;
  // Welcome user to channel
  if(who !== bot.user.nick) {
    bot.say(who, "Welcome " + who + " to the Project Handshake Channel. Do you want some tokens? If so, just send me a private message and remember to say 'please'.")
    bot.say(who, "The commands :help, :tokens, and :tokensplease also work.")
  }
});

bot.addListener('message', function(event) {
  // Only handle privmsgs. Not actions/notices/wallops/etc
  if (event.type !== 'privmsg') {
    return;
  }

  logger.info("MESSAGE", {from: event.nick, to: event.target, text: event.message});

  if (event.target === bot.user.nick) {
    handlePrivateMessage(event);
  } else {
    handlePublicMessage(event);
  }
});

function handlePublicMessage(event) {
  let text = event.message;
  let from = event.nick;
  if(text.match(/:help/)) {
    bot.say(from, `Need help, ${from}? Send me a PRVMSG with the word 'please'. If you qualify for the token airdrop, I will generate a validation code for you`);
  } else if(text.match(/:token/)) {
    checkUser(from)
  }
}

function handlePrivateMessage(event) {
  let text = event.message;
  let from = event.nick;
  if(text.match(/please/)) {
    checkUser(from);
  } else {
    bot.say(from, "Hmmm, did you mean to say please? Or :help?")
  }
}


/**
 * Verification / coin stuff
 */

function checkUser(from) {
  bot.say(config.CHANNEL, "Checking if " + from + " Qualifies for the airdrop");
  bot.say(from, "Your account must be over 6 months old. Checking now.");

  bot.getNickInfo(from)
    .then(verifyUser)
    .catch(err => {
      logger.error('Error getting info', err ? err.stack : '');
      bot.say(from, `I'm sorry, there was an issue with getting your info. Try again soon?`);
    });
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
    logger.info('Connecting...');
    bot.connect();
  }
};

// module.exports.init(()=>{});
