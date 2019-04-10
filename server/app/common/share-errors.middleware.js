module.exports = function () {
  return function (req, res, next) {
    res.locals.error = req.flash('error')
    next()
  }
}
