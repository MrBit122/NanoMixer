require('dotenv').config()

const mongoose = require('mongoose')

const config = require('./common/config')

const app = require('./services/express')

require('./route')
require('./crontab')
require('./listeners')

mongoose.connect(config.db.uri, config.db.options)

app.listen(config.app.port)
