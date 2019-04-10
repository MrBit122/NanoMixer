const _ = require('lodash')
const axios = require('axios')
const Decimal = require("decimal.js")

const config = require('../common/config')

let locks = {}

function request (action, params) {
  return new Promise((resolve, reject) => {
    const data = Object.assign({}, { action }, params)
    axios.post(config.nano.address, data).then((response) => {
      if (response.data.error) reject(response.data.error)
      else resolve(response.data)
    }).catch((err) => {
      reject(err)
    })
  })
}

function createAccount (wallet) {
  return new Promise((resolve, reject) => {
    request('account_create', { wallet }).then((data) => {
      resolve(data.account)
    }).catch((err) => {
      reject(err)
    })
  })
}

function getAccountBalance (wallet, account) {
  return new Promise((resolve, reject) => {
    request('account_balance', { wallet, account }).then((data) => {
      resolve(mraiFromRaw(data.balance))
    }).catch((err) => {
      reject(err)
    })
  })
}

function removeAccount (wallet, account) {
  return new Promise((resolve, reject) => {
    request('account_remove', { wallet, account }).then((data) => {
      resolve(data.removed)
    }).catch((err) => {
      reject(err)
    })
  })
}

function beginPayment (wallet) {
  return new Promise((resolve, reject) => {
    request('payment_begin', { wallet }).then((data) => {
      resolve(data.account)
    }).catch((err) => {
      reject(err)
    })
  })
}

function endPayment (wallet, account) {
  return new Promise((resolve, reject) => {
    request('payment_end', { wallet, account }).then((data) => {
      resolve()
    }).catch((err) => {
      reject(err)
    })
  })
}

function _send (wallet, source, destination, amount) {
  return new Promise((resolve, reject) => {
    request('send', { wallet, source, destination, amount: mraiToRaw(amount) }).then((data) => {
      resolve(data.block)
    }).catch((err) => {
      reject(err)
    })
  })
}

function send (wallet, source, destination, amount) {
  return new Promise((resolve, reject) => {
    if (walletCheckLock(wallet)) return reject('Wallet is locked')
    _send(wallet, source, destination, amount).then(resolve).catch(reject)
  })
}

function sendAuto (wallet, destination, amount) {
  return new Promise((resolve, reject) => {
    if (walletCheckLock(wallet)) return reject('Wallet is locked')
    walletBalance(wallet).then((balance) => {
      if (balance < amount) return reject('Insufficient balance')
      walletLock(wallet)
      doSendAuto(wallet, destination, amount).then(resolve).catch(reject).finally(() => {
        walletUnlock(wallet)
      })
    })
  })
}

function doSendAuto (wallet, destination, amount) {
  return new Promise((resolve, reject) => {
    walletBalances(wallet).then((balances) => {
      let sources = {}
      collectSources(sources, balances, amount)
      const promises = _.map(sources, (amount, source) => _send(wallet, source, destination, amount))
      Promise.all(promises).then(resolve).catch(reject)
    })
  })
}

function collectSources (sources, balances, amount) {
  _.each(balances, (balance, source) => {
    if (amount == 0) {
      return false
    } else if (balance >= amount) {
      sources[source] = amount
      return false
    } else if (balance > 0) {
      amount = new Decimal(amount).sub(balance)
      sources[source] = balance
    }
  })
}

function walletBalances (wallet) {
  return new Promise((resolve, reject) => {
    request('wallet_balances', { wallet }).then((data) => {
      resolve(_.mapValues(data.balances, (a) => mraiFromRaw(a.balance)))
    }).catch((err) => {
      reject(err)
    })
  })
}

function walletBalance (wallet) {
  return new Promise((resolve, reject) => {
    walletBalances(wallet).then((balances) => {
      resolve(_.reduce(balances, (a, c) => a.add(c), new Decimal(0)).toNumber())
    }).catch((err) => {
      reject(err)
    })
  })
}

function walletClear (wallet) {
  return new Promise((resolve, reject) => {
    walletBalances(wallet).then((balances) => {
      let promises = []
      _.each(balances, (balance, account) => { if (balance == 0) promises.push(removeAccount(wallet, account)) })
      Promise.all(promises).then(resolve).catch(reject)
    })
  })
}

function walletLock (wallet) {
  locks[wallet] = true
}

function walletUnlock (wallet) {
  delete locks[wallet]
}

function walletCheckLock (wallet) {
  return locks[wallet] === true
}

function mraiFromRaw (raw) {
  return new Decimal(raw).dividedBy(Math.pow(10, 30)).toNumber()
}

function mraiToRaw (mrai) {
  return new Decimal(mrai).times(Math.pow(10, 30)).toFixed()
}

module.exports = {
  request, createAccount, getAccountBalance, removeAccount,
  walletBalances, walletBalance, walletClear,
  beginPayment, endPayment, send, sendAuto
}
