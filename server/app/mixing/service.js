const Mixing = require('./model')

const config = require('../common/config')
const nano = require('../services/nano')

async function payAccount (account) {
  const blocks = await nano.sendAuto(config.nano.walletWithdraw, account.address, account.amount)
  Mixing.updateOne({ 'wallet.accounts._id': account._id }, { 'wallet.accounts.$.paid': true, 'wallet.accounts.$.blocks': blocks }).exec()
  nano.walletClear(config.nano.walletWithdraw)
}

async function pay (mixing) {
  for (let i = 0; i < mixing.wallet.accounts.length; i++) {
    const account = mixing.wallet.accounts[i]
    if (!account.paid) {
      await payAccount(account)
    }
  }
}

module.exports = {
  pay
}
