const lj = require('load-json-file')
const rra = require('recursive-readdir-async')
const path = require('path')
const name = '.http_interceptor'

const files = {
  homeDir: () => require('os').homedir(),
  appDir: () => files.homeDir() + path.sep + name + path.sep,
  sep: () => path.sep,
  getFiles: (path) => rra.list(path),
  loadJson: (file) => lj(file)
}

module.exports = files
