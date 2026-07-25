// PM2 process config for ProxyGPT Online.
//   pm2 start ecosystem.config.cjs && pm2 save
//
// Outbound requests are pinned to IPv6 in code (server/app.ts) when NODE_ENV is
// production, so Proxy-Seller consistently sees the VPS's IPv6 address.
module.exports = {
  apps: [
    {
      name: 'proxygpt',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
