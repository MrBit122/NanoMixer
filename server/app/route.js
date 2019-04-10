const app = require('./services/express')

const routes = require('./index.route')

app.use('/', routes)
