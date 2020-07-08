const files = require('../services/files')

const rules = {
  getRules: () => files.getFiles(files.appDir().concat('rules')),
  getRule: (rule) => files.loadJson(rule.fullname)
}

module.exports = rules
