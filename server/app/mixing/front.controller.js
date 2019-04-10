const _ = require('lodash')
const createError = require('http-errors')
const crypto = require('crypto')
const nanocurrency = require('nanocurrency')
const Decimal = require('decimal.js')

const Mixing = require('./model')
const Payment = require('../payment/model')
const config = require('../common/config')
const nano = require('../services/nano')

function findOrCreateToken (req) {
  if (req.session.mixingToken) {
    return req.session.mixingToken
  } else {
    return req.session.mixingToken = crypto.randomBytes(16).toString('hex')
  }
}

function start (req, res, next) {
  res.render('front::mixing/start', { token: findOrCreateToken(req) })
}

function store (req, res, next) {
  if (!req.session.mixingToken) return next(createError(400))
  Mixing.create({ token: req.session.mixingToken, status: 'started' }, (err, mixing) => {
    if (err) return next(err)
    delete req.session.mixingToken
    res.redirect(`/mixings/${mixing._id}/deposit`)
  })
}

function deposit (req, res, next) {
  Mixing.findOne({ _id: req.params.id, $or: [ { status: 'started' }, { status: 'deposited' } ] }, (err, mixing) => {
    if (err) return next(err)
    if (!mixing) return next(createError(404))
    Payment.findOneOrCreate({ payable: mixing._id, payableModel: 'mixing' }, {}, async (err, payment) => {
      if (err) return next(err)
      const balance = await nano.walletBalance(config.nano.walletWithdraw)
      res.render('front::mixing/deposit', { payment, balance })
    })
  })
}

function confirm (req, res, next) {
  Mixing.findOne({ _id: req.params.id, status: 'deposited' }).populate('deposit').exec((err, mixing) => {
    if (err) return next(err)
    if (!mixing) return next(createError(404))
    res.render('front::mixing/confirm', { mixing })
  })
}

function mix (req, res, next) {
  const n = parseInt(req.query.pieces)
  const pieces = _.range(0, isNaN(n) ? 4 : Math.max(n, 1))
  Mixing.findOne({ _id: req.params.id, status: 'confirmed' }).populate('deposit').exec((err, mixing) => {
    if (err) return next(err)
    if (!mixing) return next(createError(404))
    res.render('front::mixing/mix', { mixing, pieces })
  })
}

function createAccount (i, seed) {
  const secretKey = nanocurrency.deriveSecretKey(seed, i)
  const publicKey = nanocurrency.derivePublicKey(secretKey)
  const address = nanocurrency.deriveAddress(publicKey)
  return { secretKey, publicKey, address }
}

function sanitizeStoreWallet (req, res, next) {
  let pieces = req.body.pieces
  pieces = _.map(pieces, (p) => parseFloat(p))
  pieces = _.filter(pieces, (p) => !isNaN(p))
  req.body.pieces = pieces
  let paymentDelay = req.body.paymentDelay
  req.body.paymentDelay = parseInt(paymentDelay)
  next()
}

function validateStoreWallet (req, res, next) {
  const paymentDelay = req.body.paymentDelay
  if (isNaN(paymentDelay) || paymentDelay < 0) {
    req.flash('error', 'The payment delay should be a number equal to or greater than zero.')
    res.redirect('back')
  } else {
    next()
  }
}

function validatePieces (mixing, req, res, next) {
  const pieces = req.body.pieces
  const sum = pieces.reduce((s, p) => s.plus(p), new Decimal(0))
  if (0 == sum || mixing.deposit.finalAmount != sum) {
    req.flash('error', 'The total amount of pieces should be equal to final amount.')
    res.redirect('back')
  } else {
    next()
  }
}

function storeWallet (req, res, next) {
  Mixing.findOne({ _id: req.params.id, status: 'confirmed' }).populate('deposit').exec((err, mixing) => {
    if (err) return next(err)
    validatePieces(mixing, req, res, () => {
      doStoreWallet(mixing, req, res, next)
    })
  })
}

async function doStoreWallet (mixing, req, res, next) {
  const seed = await nanocurrency.generateSeed()
  let accounts = []
  req.body.pieces.forEach((piece, i) => {
    accounts.push({ ...createAccount(i, seed), amount: piece })
  })
  mixing.set({ wallet: { accounts, seed }, paymentDelay: req.body.paymentDelay * 60, status: 'mixed' })
  mixing.save((err) => {
    if (err) return next(err)
    res.redirect(`/mixings/${mixing._id}/withdraw`)
  })
}

function withdraw (req, res, next) {
  Mixing.findOne({ _id: req.params.id, status: 'mixed' }, (err, mixing) => {
    if (err) return next(err)
    if (!mixing) return next(createError(404))
    res.render('front::mixing/withdraw', { mixing })
  })
}

function destroy (req, res, next) {
  Mixing.findById(req.params.id, (err, mixing) => {
    if (err) return next(err)
    mixing.remove((err) => {
      if (err) return next(err)
      res.render('front::mixing/destroyed', { mixing })
    })
  })
}

function forward (mixing, req, res) {
  switch (mixing.status) {
    case 'started':
      res.redirect(`/mixings/${mixing._id}/deposit`)
      break
    case 'deposited':
      res.redirect(`/mixings/${mixing._id}/confirm`)
      break
    case 'confirmed':
      res.redirect(`/mixings/${mixing._id}/mix`)
      break
    case 'mixed':
      res.redirect(`/mixings/${mixing._id}/withdraw`)
      break
  }
}

function reset (req, res, next) {
  Mixing.findOne({ token: req.body.token }, (err, mixing) => {
    if (err) return next(err)
    if (!mixing) {
      req.flash('error', 'Invalid token.')
      res.redirect('back')
    } else {
      forward(mixing, req, res)
    }
  })
}

module.exports = {
  start, store, deposit, confirm, mix, withdraw, destroy, reset,
  sanitizeStoreWallet, validateStoreWallet, storeWallet
}
