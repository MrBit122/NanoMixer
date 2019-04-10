function index (req, res, next) {
  res.render('front::index')
}

function faq (req, res, next) {
  res.render('front::faq')
}

function contact (req, res, next) {
  res.render('front::contact')
}

module.exports = {
  index, faq, contact
}
