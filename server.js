services:
  - type: web
    name: veeqo-quickbase-sync
    env: node
    buildCommand: npm install
    startCommand: node server.js
    plan: free
