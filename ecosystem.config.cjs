/* PM2 config — CALMER full-stack
   Runs the Express API + Socket.io server which ALSO serves the built
   frontend from client/dist (build the client first: cd client && npm run build) */
module.exports = {
  apps: [
    {
      name: 'calmer',
      cwd: __dirname + '/server',
      script: 'server.js',
      env: { NODE_ENV: 'production', PORT: 3000 },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
