const mongoose = require('mongoose')

const config = require('../common/config')
const nano = require('../services/nano')

const AccountSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  secretKey: {
    type: String,
    required: true
  },
  publicKey: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  paid: {
    type: Boolean,
    default: false
  },
  blocks: {
    type: Array
  }
})

const WalletSchema = new mongoose.Schema({
  accounts: [AccountSchema],
  seed: {
    type: String,
    required: true
  }
})

const MixingSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true
  },
  wallet: WalletSchema,
  status: {
    type: String,
    required: true,
    enum: ['started', 'deposited', 'confirmed', 'mixed']
  },
  paymentDelay: {
    type: Number,
    default: 0,
    min: 0
  },
  expiredAt: {
    type: Date
  }
}, {
  timestamps: true,
  toObject: { virtuals:true },
  toJSON: { virtuals:true }
})

MixingSchema.virtual('deposit', {
  ref: 'payment',
  localField: '_id',
  foreignField: 'payable',
  justOne: true
})

MixingSchema.pre('remove', function (next) {
  this.populate('deposit', (err, mixing) => {
    if (err) return next(err)
    mixing.deposit.remove((err) => {
      next(err)
    })
  })
})

MixingSchema.plugin(require('mongoose-findorcreate'))

module.exports = mongoose.model('mixing', MixingSchema)
