const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
    app.use(
        createProxyMiddleware('http://localhost:5020/api/merge-orchestrator-server', {
            pathRewrite: { '^/api/merge-orchestrator-server/': '/' }
        })
    );
    app.use(
        createProxyMiddleware('http://localhost:5002/ws/merge-orchestrator-server', {
            pathRewrite: { '^/ws/merge-orchestrator-server': '/' },
            ws: true,
        })
    );
    app.use(
        createProxyMiddleware('http://localhost:9000/api/gateway', {
            pathRewrite: { '^/api/gateway/': '/' },
        })
    );
    app.use(
        createProxyMiddleware('http://localhost:9000/ws/gateway', {
            pathRewrite: { '^/ws/gateway/': '/' },
            ws: true,
        })
    );
};
