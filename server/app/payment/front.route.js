const express = require('express')

const ctrl = require('./front.controller')

const router = express.Router()

router.post('/:id/check', ctrl.check)
router.post('/:id/confirm', ctrl.validateConfirm, ctrl.confirm)

module.exports = router
