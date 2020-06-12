const http = require('http'), httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {

    var option = {
        target: `http://${req.headers['host']}`,
        selfHandleResponse: true
    };
    proxy.on('proxyRes', function (proxyRes, req, res) {
        var body = [];
        if (proxyRes.eventNames().length < 2) {
            proxyRes.on('data', function (chunk) {
                body.push(chunk);
            });
            proxyRes.on('end', function () {
                const switchHeaders = (res, headers) => {
                    if (!res.headersSent) {
                        Object.keys(headers).forEach(key => {
                            res.setHeader(key, headers[key])
                        })
                    }
                }
                switchHeaders(res, this.headers)
                const response = Buffer.concat(body);
                console.log(`${this.statusCode} ${this.req.method} ${this.req._headers['host']} ${this.req.path} HTTP/${this.httpVersion}`)
                res.statusCode = this.statusCode;
                res.end(response);
            });
        }
    });
    proxy.on('error', function (err) {
        console.error(err);
    })
    proxy.web(req, res, option);
}).listen(8008);