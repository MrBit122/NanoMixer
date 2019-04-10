const express = require('express')

const ctrl = require('./front.controller')

const router = express.Router()

router.get('/start', ctrl.start)
router.get('/:id/deposit', ctrl.deposit)
router.get('/:id/confirm', ctrl.confirm)
router.get('/:id/mix', ctrl.mix)
router.get('/:id/withdraw', ctrl.withdraw)

router.post('/store', ctrl.store)
router.post('/:id/wallet/store', ctrl.sanitizeStoreWallet, ctrl.validateStoreWallet, ctrl.storeWallet)
router.post('/reset', ctrl.reset)
router.post('/:id/destroy', ctrl.destroy)

module.exports = router
