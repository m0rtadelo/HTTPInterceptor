const lj = require('load-json-file')
const wj = require('write-json-file')

let values = {
  forceIdentity: true,
  disableCache: true,
  port: 8008,
  listen: true
}
const options = {
  getValues: () => values,
  setValues: (data) => { values = data },
  getForceIdentity: () => values.forceIdentity,
  getDisableCache: () => values.disableCache,
  getPort: () => values.port,
  getListen: () => values.listen,
  setForceIdentity: (value) => { values.forceIdentity = value },
  setDisableCache: (value) => { values.disableCache = value },
  setPort: (value) => { values.port = value },
  setListen: (value) => { values.listen = value },
  save: (data) => {
    if (data) { options.setValues(data) }
    wj('./settings.json', values).catch(err => { console.error(err) })
  },
  load: () => {
    lj('./settings.json').then(opts => {
      values.forceIdentity = opts.forceIdentity
      values.disableCache = opts.disableCache
      values.port = opts.port
      values.listen = opts.listen
    }).catch(err => { console.error(err) })
  }
}
options.load()
module.exports = options
