const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
    app.use(
        createProxyMiddleware(
            'http://localhost:8070/api/apps-metadata-service',
            {
                pathRewrite: { '^/api/apps-metadata-service/': '/' },
            }
        )
    );
    app.use(
        createProxyMiddleware(
            'http://localhost:5020/api/merge-orchestrator-server',
            {
                pathRewrite: { '^/api/merge-orchestrator-server/': '/' },
            }
        )
    );
    app.use(
        createProxyMiddleware(
            'http://localhost:5002/ws/merge-notification-server',
            {
                pathRewrite: { '^/ws/merge-notification-server': '/' },
                ws: true,
            }
        )
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
