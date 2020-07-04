const http = require('http'); const httpProxy = require('http-proxy')
const options = require('./models/settings')
const url = require('url')

var proxy = httpProxy.createProxyServer()
let rules = { request: {}, response: {} }

const Proxy = {
  win: undefined,
  options: options,
  VALUES: {},
  REQS: {},
  setRules: (jsonRules) => {
    rules = jsonRules || { request: {}, response: {} }
  },
  reset: () => {
    Proxy.VALUES = {}
  },
  http: () => http.createServer(function (req, res) {
    var option = {
      target: `http://${req.headers.host}`,
      selfHandleResponse: true
    }
    const path = new url.URL(req.url).pathname
    const urlObject = new url.URL(req.url)

    const switchHeaders = (res, headers) => {
      if (!res.headersSent && headers) {
        Object.keys(headers).forEach(key => {
          res.setHeader(key, headers[key])
        })
      }
    }

    const getPassthrough = (entity) => {
      if (rules.passthrough) {
        rules.passthrough.forEach((pt) => {
          if (entity[pt.output]) {
            entity[pt.output] = Proxy.VALUES[pt.input]
          }
        })
      }
    }

    const setPassthrough = (entity) => {
      rules.passthrough.forEach((pt) => {
        Proxy.VALUES[pt.input] = entity[pt.input]
      })
    }

    const addData = (id, type, status, method, host, path, httpVersion, request, response) => {
      const info = {
        id: id,
        type: type,
        status: status,
        method: method,
        host: host,
        path: path,
        httpVersion: httpVersion,
        request: rules.request[path],
        response: rules.response[path]
      }
      const data = {
        info: info,
        request: request,
        response: response
      }

      if (Proxy.win) {
        Proxy.win.webContents.send('info', data)
      } else {
        console.log(`#${id} REQ ${status} ${method} ${host} ${path} HTTP/${httpVersion}`)
      }
    }
    const getId = () => (Proxy.VALUES.countReq + 0 || 0) + (Proxy.VALUES.countRes + 0 || 0)
    if (!Proxy.REQS[path]) {
      Proxy.REQS[path] = true
      proxy.on('proxyReq', function (proxyReq, req, res) {
        this._path = proxyReq.path
        if (options.getForceIdentity()) {
          proxyReq.setHeader('Accept-Encoding', 'identity')
        }
        if (options.getDisableCache()) {
          proxyReq.setHeader('If-Modified-Since', '')
          proxyReq.setHeader('ETag', '')
          proxyReq.setHeader('If-None-Match', '')
        }
        if (req._events.data.length < 3) {
          req.on('data', function (chunk) {
            if (!Proxy.VALUES.request) {
              Proxy.VALUES.request = {}
            }
            Proxy.VALUES.request[new url.URL(req.url).pathname] = chunk.toString()
          })
        }
        if (proxyReq.path === path && rules.request[path]) {
          res.statusCode = rules.request[path].status || 200
          switchHeaders(res, rules.request[path].headers)
          const ruleBody = JSON.parse(JSON.stringify(rules.request[path].body))
          getPassthrough(ruleBody)
          let strRuleBody = JSON.stringify(ruleBody)
          if (res.getHeaders()['content-type'].includes('text')) {
            strRuleBody = rules.request[path].body
          }
          switchHeaders(res, { 'content-length': Buffer.from(strRuleBody).length })
          Proxy.VALUES.countReq = Proxy.VALUES.countReq + 1 || 1
          addData(getId(), 'REQ', res.statusCode, proxyReq.method, urlObject.host, path, req.httpVersion, {
            body: Proxy.VALUES.request ? JSON.stringify(Proxy.VALUES.request[path]) : undefined,
            headers: req.headers
          }, {
            body: strRuleBody,
            headers: res.getHeaders()
          })
          res.end(strRuleBody)
        }
      })
    }
    if (!rules.request[path]) {
      proxy.on('proxyRes', function (proxyRes, req, res) {
        var body = []
        if (proxyRes.eventNames().length < 2) {
          proxyRes.on('data', function (chunk) {
            body.push(chunk)
          })
          proxyRes.on('end', function () {
            if (!rules.request[this.req.path]) {
              Proxy.VALUES.countRes = Proxy.VALUES.countRes + 1 || 1
              switchHeaders(res, this.headers)
              let response = Buffer.concat(body)

              Proxy.VALUES[this.req.path] = Proxy.VALUES[this.req.path] + 1 || 0
              res.statusCode = this.statusCode

              addData(getId(), 'REQ', this.statusCode, this.req.method, this.req._headers.host, this.req.path, this.httpVersion, {
                body: Proxy.VALUES.request ? Proxy.VALUES.request[this.req.path] : undefined,
                headers: req.headers
              },
              {
                body: response.toString(),
                headers: res.getHeaders()
              })
              if (rules.response[this.req.path] &&
                (!rules.response[this.req.path].useIn || rules.response[this.req.path].useIn.includes(Proxy.VALUES[this.req.path]))) {
                try {
                  response = JSON.parse(response.toString())
                } catch (error) {
                  response = response.toString()
                }
                setPassthrough(response)
                res.statusCode = rules.response[this.req.path].status || res.statusCode
                const ruleBody = rules.response[this.req.path].body
                getPassthrough(ruleBody)
                switchHeaders(res, { 'content-length': Buffer.from(JSON.stringify(ruleBody)).length })
                switchHeaders(res, rules.response[this.req.path].headers)
                res.end(JSON.stringify(ruleBody))
              } else {
                if (!rules.request[this.req.path]) {
                  res.end(response)
                }
              }
            }
          })
        }
      }, { once: true })
    }
    proxy.on('error', function (err) {
      console.error(err)
    })
    proxy.web(req, res, option)
  })
}

exports.Proxy = Proxy
