const files = require('../services/files')

const rules = {
  getRules: () => files.getFiles(files.appDir().concat('rules'))
}

module.exports = rules
