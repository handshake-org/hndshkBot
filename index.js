var dotenv = require('dotenv');
dotenv.config();

var config = {
    channels: [process.env.IRC_CHANNEL],
    server: "chat.freenode.net",
    botName: process.env.BOTNAME,
    password: process.env.PASSWORD
};

var irc = require('irc');

var bot = new irc.Client(config.server, config.botName, {
  channels: config.channels
})

var user = {};

function grantTokens(nick) {
  console.log('granting tokens to ' + nick)
  // omg send tokens 
}

function verifyUser() {
  bot.say(user.nick, "We are checking your nick now")
  if(user.registered > new Date("2017 05 09")) {
    bot.say(user.nick, "Your nick is valid! get some tokens")
    grantTokens(user.nick);
  } else {
    bot.say(user.nick, "Sorry no tokens for you")
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
      }
      break
  }
})

bot.addListener('pm', function(from, message) {
  bot.say(from, "Hi, do you want some HandShake Tokens?")

  bot.send('/msg nickserv info ' + from)
})

bot.addListener('error', function(msg) {
  console.log("Error " + JSON.stringify(msg));
})

bot.addListener('registered', function(message) {
  console.log('$$$$$ REGISTERED')
})

bot.addListener('join', function(channel, who) {
  // Welcome user to channel
  bot.say(channel, "Welcome " + who + " to the Project Handshake Channel. Want Some Tokens?")
})

bot.join(config.channel, config.password)

