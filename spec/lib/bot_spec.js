var bot = require('../../lib/bot')

describe('freenode irc bot', (()=> {

  it('should have a hello method', ((done)=> {
    expect(bot.hello()).toBe(true);
    done();
    })
  )
}))
  
