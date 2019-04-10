const path = require('path')
const express = require('express')
const namespace = require('express-views-namespaces')
const session = require('express-session')
const flash = require('connect-flash');
const logger = require('morgan')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const cors = require('cors')

const config = require('../common/config')
const View = require('../common/view')
const shareErrors = require('../common/share-errors.middleware')

const app = express()

namespace(app)

app.set('view', View)
app.set('view engine', 'pug')
app.set('views', {
  'front': path.resolve('..', 'front', 'views'),
  'back': path.resolve('..', 'back', 'views')
})

app.disable('x-powered-by')

app.use(logger('dev'))

// public files
app.use(express.static(path.resolve('..', 'front', 'public')))

// parse body params and attache them to req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// secure apps by setting various HTTP headers
app.use(helmet())

// enable CORS - Cross Origin Resource Sharing
app.use(cors())

// session
app.use(session(config.session))
app.use(flash())

// errors
app.use(shareErrors())

module.exports = app
