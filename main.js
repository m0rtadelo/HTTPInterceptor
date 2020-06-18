const http = require('http'); const httpProxy = require('http-proxy')
const { rules, options } = require('./settings.json')
const url = require('url')
var proxy = httpProxy.createProxyServer()

const VALUES = {
  counter: 0
}

http.createServer(function (req, res) {
  var option = {
    target: `http://${req.headers.host}`,
    selfHandleResponse: true
  }
  const path = new url.URL(req.url).pathname

  const switchHeaders = (res, headers) => {
    if (!res.headersSent && headers) {
      Object.keys(headers).forEach(key => {
        res.setHeader(key, headers[key])
      })
    }
  }

  const getPassthrough = (entity) => {
    rules.passthrough.forEach((pt) => {
      entity[pt.output] = VALUES[pt.input]
    })
  }

  const setPassthrough = (entity) => {
    rules.passthrough.forEach((pt) => {
      VALUES[pt.input] = entity[pt.input]
    })
  }

  VALUES.counter++

  proxy.on('proxyReq', function (proxyReq, req, res) {
    if (options.forceIdentity) {
      proxyReq.setHeader('Accept-Encoding', 'identity')
    }
    if (proxyReq.path === path && (options.request && rules.request[path])) {
      res.statusCode = rules.request[path].status || 200
      switchHeaders(res, rules.request[path].headers)
      const ruleBody = JSON.parse(JSON.stringify(rules.request[path].body))
      getPassthrough(ruleBody)
      switchHeaders(res, { 'content-length': JSON.stringify(ruleBody).length + 3 })
      res.end(JSON.stringify(ruleBody))
    }
  })
  if (!(options.request && rules.request[path])) {
    proxy.on('proxyRes', function (proxyRes, req, res) {
      var body = []
      if (proxyRes.eventNames().length < 2) {
        proxyRes.on('data', function (chunk) {
          body.push(chunk)
        })
        proxyRes.on('end', function () {
          switchHeaders(res, this.headers)
          let response = Buffer.concat(body)
          console.log(`${this.statusCode} ${this.req.method} ${this.req._headers.host} ${this.req.path} HTTP/${this.httpVersion}`)
          res.statusCode = this.statusCode
          VALUES[this.req.path] = VALUES[this.req.path] + 1 || 0
          if (options.response && rules.response[this.req.path] &&
            (!rules.response[this.req.path].useIn || rules.response[this.req.path].useIn.includes(VALUES[this.req.path]))) {
            try {
              response = JSON.parse(response.toString())
            } catch (error) {
              response = response.toString()
            }
            setPassthrough(response)
            res.statusCode = rules.response[this.req.path].status || res.statusCode
            switchHeaders(res, rules.response[this.req.path].headers)
            const ruleBody = rules.response[this.req.path].body
            getPassthrough(ruleBody)
            switchHeaders(res, { 'content-length': JSON.stringify(ruleBody).length })
            res.end(JSON.stringify(ruleBody))
          } else {
            if (!rules.request[this.req.path]) {
              res.end(response)
            }
          }
        })
      }
    })
  }
  proxy.on('error', function (err) {
    console.error(err)
  })
  proxy.web(req, res, option)
}).listen(8008)
