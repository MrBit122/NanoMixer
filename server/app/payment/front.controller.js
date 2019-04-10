const createError = require('http-errors')

const Payment = require('./model')
const config = require('../common/config')
const eventbus = require('../services/eventbus')
const nano = require('../services/nano')

function validateConfirm (req, res, next) {
  const fee = req.body.fee
  if (isNaN(fee) || fee < 0.5 || fee > 3.5) {
    req.flash('error', 'Fee must be a valid number btween 0.5 and 3.5.')
    res.redirect('back')
  } else {
    next()
  }
}

function validateBalance (balance, req, res, next) {
  if (balance <= 0) {
    req.flash('error', 'Account still has 0 balance.')
    res.redirect('back')
  } else if (balance < 0.01) {
    req.flash('error', `The minimume amount is 0.01 NANO you deposited ${balance} NANO.`)
    res.redirect('back')
  } else {
    next()
  }
}

function onValidPayment (payment, balance, req, res, next) {
  payment.set({ amount: balance, status: 'paid' })
  payment.save((err) => {
    if (err) return next(err)
    eventbus.emit('payments.paid', payment)
    res.redirect(`/mixings/${payment.payable}/confirm`)
  })
}

function check (req, res, next) {
  Payment.findOne({ _id: req.params.id, $or: [ { status: 'waiting' }, { status: 'paid' }] }, (err, payment) => {
    if (err) return next(err)
    if (!payment) return next(createError(404))
    nano.getAccountBalance(config.nano.walletDeposit, payment.account).then((balance) => {
      validateBalance(balance, req, res, () => onValidPayment(payment, balance, req, res, next))
    }).catch((err) => {
      next(err)
    })
  })
}

function confirm (req, res, next) {
  Payment.findOne({ _id: req.params.id, status: 'paid' }, (err, payment) => {
    if (err) return next(err)
    if (!payment) return next(createError(404))
    payment.set({ fee: req.body.fee, status: 'confirmed' })
    payment.save((err) => {
      if (err) return next(err)
      eventbus.emit('payments.confirmed', payment)
      res.redirect(`/mixings/${payment.payable}/mix`)
    })
  })
}

module.exports = {
  check, validateConfirm, confirm
}
