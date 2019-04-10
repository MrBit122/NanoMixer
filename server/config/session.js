const session = require('express-session')
const RedisStore = require('connect-redis')(session)

const options = require('./redis')

module.exports = {
  name: 'sid',
  store: new RedisStore(options),
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}
