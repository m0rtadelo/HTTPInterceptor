const http = require('http'); const httpProxy = require('http-proxy')
const rules = require('./rules.json')
const url = require('url')
var proxy = httpProxy.createProxyServer()
const OPTIONS = {
  response: true,
  request: true,
  forceIdentity: true
}
http.createServer(function (req, res) {
  var option = {
    target: `http://${req.headers.host}`,
    selfHandleResponse: true
  }
  const path = new url.URL(req.url).pathname
  let counter = 0
  const switchHeaders = (res, headers) => {
    if (!res.headersSent && headers) {
      Object.keys(headers).forEach(key => {
        res.setHeader(key, headers[key])
      })
    }
  }

  if ((OPTIONS.request && rules.request[path]) || OPTIONS.forceIdentity) {
    proxy.on('proxyReq', function (proxyReq, req, res) {
      if (OPTIONS.forceIdentity) {
        proxyReq.setHeader('Accept-Encoding', 'identity')
      }
      if (proxyReq.path === path && (OPTIONS.request && rules.request[path])) {
        res.statusCode = rules.request[path].status || 200
        switchHeaders(res, rules.request[path].headers)
        req = undefined
        proxyReq = undefined
        const ruleBody = JSON.parse(JSON.stringify(rules.request[path].body))
        ruleBody.access_token = OPTIONS.accesstoken
        switchHeaders(res, { 'content-length': JSON.stringify(ruleBody).length + 3 })
        res.end(JSON.stringify(ruleBody))
      }
    })
  }
  if (!(OPTIONS.request && rules.request[path])) {
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
          if (OPTIONS.response && rules.response[this.req.path] && rules.response[this.req.path].useIn === counter) {
            counter++
            try {
              response = JSON.parse(response.toString())
            } catch (error) {}
            OPTIONS.accesstoken = response.access_token || OPTIONS.accesstoken
            res.statusCode = rules.response[this.req.path].status || res.statusCode
            switchHeaders(res, rules.response[this.req.path].headers)
            const ruleBody = rules.response[this.req.path].body
            ruleBody.access_token = OPTIONS.accesstoken
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
