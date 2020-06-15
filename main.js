const http = require('http'); const httpProxy = require('http-proxy')
const rules = require('./rules.json')
const url = require('url')
var proxy = httpProxy.createProxyServer()
const OPTIONS = {
  response: false,
  request: true
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

  if (OPTIONS.request && rules.request[path]) {
    proxy.on('proxyReq', function (proxyReq, req, res) {
      if (proxyReq.path === path) {
        res.statusCode = rules.request[path].status || 200
        switchHeaders(res, { 'content-length': JSON.stringify(rules.request[path].body).length })
        switchHeaders(res, rules.request[path].headers)
        res.end(JSON.stringify(rules.request[path].body))
      }
    })
  } else {
    proxy.on('proxyRes', function (proxyRes, req, res) {
      var body = []
      if (proxyRes.eventNames().length < 2) {
        proxyRes.on('data', function (chunk) {
          body.push(chunk)
        })
        proxyRes.on('end', function () {
          switchHeaders(res, this.headers)
          const response = Buffer.concat(body)
          console.log(`${this.statusCode} ${this.req.method} ${this.req._headers.host} ${this.req.path} HTTP/${this.httpVersion}`)
          res.statusCode = this.statusCode
          if (OPTIONS.response && rules.response[this.req.path]) {
            res.statusCode = rules.response[this.req.path].status || res.statusCode
            switchHeaders(res, { 'content-length': JSON.stringify(rules.response[this.req.path].body).length })
            switchHeaders(res, rules.response[this.req.path].headers)
            res.end(JSON.stringify(rules.response[this.req.path].body))
          } else {
            res.end(response)
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
