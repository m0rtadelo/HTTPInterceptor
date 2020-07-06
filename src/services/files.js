// const lj = require('load-json-file')
const path = require('path')
const name = '.http_interceptor'

const Files = {
  homeDir: () => require('os').homedir(),
  appDir: () => Files.homeDir() + path.sep + name + path.sep,
  sep: () => path.sep
  // loadJson: async (file) => {
  //   let result
  //   try {
  //     result = await lj(file)
  //   } catch (error) {
  //     result = { error: true, message: error }
  //   }

  //   return result
  // }
}

module.exports = Files
