var dbUtils = require('../../db/utils')
const logger = require('../logger')

beforeAll((done) => {
  logger.info("CLEAnING DATABASE")
  dbUtils.tearDownRebuild()
    .then(res => {
      logger.info('Done cleaning Database');
      done();
    })
})





