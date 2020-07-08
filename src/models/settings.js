const lj = require('load-json-file')
const wj = require('write-json-file')

const files = require('../services/files')

let values = {
  forceIdentity: true,
  disableCache: true,
  port: 8008,
  listen: true
}
const options = {
  getValues: () => values,
  setValues: (data) => { values = data },
  getListen: () => values.listen,
  getPort: () => values.port,
  getForceIdentity: () => values.forceIdentity,
  getDisableCache: () => values.disableCache,
  save: (data) => {
    if (data) { options.setValues(data) }
    wj(files.appDir().concat('settings.json'), values).catch(err => { console.error(err) })
  },
  load: () => {
    lj(files.appDir().concat('settings.json')).then(opts => {
      values = opts
    }).catch(err => { console.error(err) })
  }
}
options.load()
module.exports = options
