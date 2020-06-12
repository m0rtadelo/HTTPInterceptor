const http = require('http'), httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer();

http.createServer(function (req, res) {
    var option = {
        target: 'http://192.168.1.6:8123',
        selfHandleResponse: true
    };
    proxy.on('proxyRes', function (proxyRes, req, res) {
        var body = [];
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
            console.log("end - ", this.req.path);
            res.statusCode = this.statusCode;
            res.end(response);
        });
    });
    proxy.web(req, res, option);
}).listen(8008);