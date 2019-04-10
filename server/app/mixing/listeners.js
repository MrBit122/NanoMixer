const Mixing = require('./model')
const config = require('../common/config')
const eventbus = require('../services/eventbus')
const nano = require('../services/nano')

eventbus.on('mixings.expired', function (mixing) {
  mixing.delete()
})

eventbus.on('payments.paid', function (payment) {
  Mixing.updateOne({ _id: payment.payable }, { status: 'deposited' }).exec()
})

eventbus.on('payments.confirmed', function (payment) {
  Mixing.updateOne({ _id: payment.payable }, { status: 'confirmed' }).exec()
})
