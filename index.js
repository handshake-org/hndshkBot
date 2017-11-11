var dotenv = require('dotenv');
dotenv.config();

var config = {
    channel: process.env.IRC_CHANNEL,
    server: "chat.freenode.net",
    botName: process.env.BOTNAME,
    password: process.env.PASSWORD
};

var irc = require('irc');

var bot = new irc.Client(config.server, config.botName, {
  channels: [config.channel]
})

var user = {};

function grantTokens(nick) {
  console.log('granting tokens to ' + nick)
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

bot.addListener('error', function(msg) {
  console.log("Error " + JSON.stringify(msg));
})

bot.addListener('registered', function(message) {
  bot.say(config.channel, "Im here!");
  console.log('$$$$$ REGISTERED')
})

bot.addListener('join', function(channel, who) {
  // Welcome user to channel
  if(who != config.botName) {
    bot.say(channel, "Welcome " + who + " to the Project Handshake Channel. Do you want some tokens? If so, just send me a private message, and remember to say 'please'")
  }
})

bot.join(config.channel, config.password);

