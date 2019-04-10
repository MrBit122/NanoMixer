const fs = require('fs')
const path = require('path')
const express = require('express')

const { STORAGE_PATH } = require('./common/constants')
const mixingRoutes = require('./mixing/front.route')
const paymentRoutes = require('./payment/front.route')

const ctrl = require('./front.controller')

const router = express.Router()

router.use(function (req, res, next) {
  res.locals.onion = fs.readFileSync(path.resolve(STORAGE_PATH, 'tor/hidden_service/hostname'), { encoding: 'utf8' })
  next()
})

router.use('/mixings', mixingRoutes)
router.use('/payments', paymentRoutes)

router.get('/', ctrl.index)
router.get('/faq', ctrl.faq)
router.get('/contact', ctrl.contact)

module.exports = router
