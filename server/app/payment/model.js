const mongoose = require('mongoose')
const Decimal = require('decimal.js')

const config = require('../common/config')
const nano = require('../services/nano')

const PaymentSchema = new mongoose.Schema({
  payable: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'payableModel'
  },
  payableModel: {
    type: String,
    required: true,
    enum: ['mixing']
  },
  account: {
    type: String
  },
  amount: {
    type: Number
  },
  fee: {
    type: Number,
    min: 0.5,
    max: 3.5
  },
  status: {
    type: String,
    default: 'waiting',
    enum: ['waiting', 'paid', 'confirmed']
  }
}, {
  timestamp: true
})

PaymentSchema.virtual('feeAmount').get(function() {
  return new Decimal(this.amount).times(this.fee).dividedBy(100).toNumber()
})

PaymentSchema.virtual('finalAmount').get(function() {
  return new Decimal(this.amount).minus(this.feeAmount).toNumber()
})

PaymentSchema.pre('save', async function () {
  if (!this.isNew) return
  const account = await nano.createAccount(config.nano.walletDeposit)
  this.account = account
})

PaymentSchema.pre('remove', async function () {
  nano.createAccount(config.nano.walletWithdraw).then((account) => {
    nano.send(config.nano.walletDeposit, this.account, account, this.amount).then(() => {
      nano.removeAccount(config.nano.walletDeposit, this.account)
    })
  })
})

PaymentSchema.plugin(require('mongoose-findorcreate'))

module.exports = mongoose.model('payment', PaymentSchema)
