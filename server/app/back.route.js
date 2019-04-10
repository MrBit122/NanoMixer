const express = require('express')

const ctrl = require('./back.controller')

const router = express.Router()

router.get('/', ctrl.index)

module.exports = router
