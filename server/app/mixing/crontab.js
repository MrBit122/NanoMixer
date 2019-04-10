const cron = require('node-cron')
const moment = require('moment')

const Mixing = require('./model')
const mixingService = require('./service')
const mixingConstants = require('./constants')
const eventbus = require('../services/eventbus')

// check for expired mixings
cron.schedule('* * * * *', function () {
  Mixing.find({ status: 'completed' }, (err, mixings) => {
    if (err) return
    mixings.forEach((mixing) => {
      if (moment().isAfter(moment(mixing.createdAt).add(mixingConstants.EXPIRE_DEALY, 'seconds'))) {
        eventbus.emit('mixings.expired', mixing)
      }
    })
  })
})

// check for payments
cron.schedule('*/10 * * * * *', function () {
  Mixing.find({ status: 'mixed', 'wallet.accounts.paid': false }, async (err, mixings) => {
    if (err) return
    for (i in mixings) {
      const mixing = mixings[i]
      if (moment().isAfter(moment(mixing.createdAt).add(mixing.paymentDelay, 'seconds'))) {
        await mixingService.pay(mixing)
      }
    }
  })
})
