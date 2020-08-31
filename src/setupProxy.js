const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function(app) {
  app.use(
    createProxyMiddleware('http://localhost:5001/api/merge-orchestrator-server', {
        pathRewrite: { '^/api/api-server/': '/' }
    })
  );
};
