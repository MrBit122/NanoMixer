const express = require('express')

const frontRoutes = require('./front.route')
const backRoutes = require('./back.route')

const router = express.Router()

//router.use('/back', backRoutes)
router.use('/', frontRoutes)

module.exports = router
