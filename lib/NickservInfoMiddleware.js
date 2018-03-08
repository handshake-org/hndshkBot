var logger = require('../logger')
var config = require('../config/irc')

module.exports = FreenodeNickservInfoMiddleware

/**
  * Adds a .getNickInfo(nick) function to the IRC bot
  * - Handles multiple requests at a time
  * - Reduces request floods to a single nickserv lookup
  */

function FreenodeNickservInfoMiddleware () {
  // Contains nickserv lookups currently in progress
  let inProgress = Object.create(null)

  // Currently receiving data about this nick
  let currentNick = ''

  return function (client, rawEvents, parsedEvents) {
    parsedEvents.use(theMiddleware)

    // Add the getNickInfo function to the bot
    client.getNickInfo = function getNickInfo (nick) {
      return new Promise((resolve, reject) => {
        let alreadyChecking = !!getStatus(nick)

        // Get an existing or create a status object
        let status = inProgress[nick.toLowerCase()] = getStatus(nick) || {
          promises: [],
          resolve: resolveAll,
          reject: rejectAll,
          info: {
            nick
          }
        }

        status.promises.push({resolve, reject})

        if (alreadyChecking) {
          return
        }

        // Timeout this lookup if it's taking too long
        status.timeout = setInterval(() => {
          // The status may have been removed already, so only reject it if
          // it still exists.
          let possibleStatus = removeStatus(nick)
          possibleStatus && possibleStatus.reject(new Error('timeout'))
        }, config.NICKINFOTIMEOUT)

        // Request the nickserv info
        logger.info(`requesting info for ${nick}...`)
        client.say('nickserv', 'info ' + nick)
      })
    }
  }

  // Resolve all promises on a status object
  function resolveAll (val) {
    // Called in context of a status object
    this.promises.forEach(p => p.resolve(val))
  }
  // Reject all promises on a status object
  function rejectAll (val) {
    // Called in context of a status object
    this.promises.forEach(p => p.reject(val))
  }

  function getStatus (nick) {
    return inProgress[nick.toLowerCase()] || null
  }
  function removeStatus (nick) {
    let status = inProgress[nick.toLowerCase()]
    if (!status) {
      return null
    }
    clearTimeout(status.timeout)
    delete inProgress[nick.toLowerCase()]
    return status
  }

  // Handles the IRC commands from the bot
  function theMiddleware (command, event, client, next) {
    if (command === 'notice' && event.nick.toLowerCase() === 'nickserv') {
      let status = null
      let text = event.message.replace(/\u0002/g, '')
      let words = text.split(' ')

      switch (words[0]) {
        case 'Information':
          // Information on prawnsalad (account prawnsalad):
          let nick = words[2]
          let account = words[4].slice(0, -2)
          status = getStatus(nick)
          if (status) {
            currentNick = nick
            status.info.account = account
          }

          break
        case 'Nicks':
          status = getStatus(currentNick)
          if (status) {
            status.info.nickList = text.split(':')[1].trim().split(' ')
          }

          break
        case 'Registered':
          // Registered : Jan 08 22:56:22 2012 (5y 46w 3d ago)
          status = getStatus(currentNick)
          if (status) {
            status.info.registered = new Date(text.split(': ')[1].split('(')[0].trim())
          }

          break
      }

      if (text.indexOf('End of Info') > -1) {
        let status = removeStatus(currentNick)
        if (status) {
          logger.info('BOT: got info', {user: status.info})
          status.resolve(status.info)
        }

        let queueLength = Object.keys(inProgress).length
        if (queueLength) {
          logger.info('Nickserv lookup queue length:', queueLength)
        }
      }

      if (text.indexOf('is not registered') > -1) {
        let nick = words[0];
        let status = removeStatus(nick);
        if (status) {
          logger.info('BOT: unregistered user', {user: nick});
          status.resolve(status.info);
        }
      }
    }

    next()
  }
}
