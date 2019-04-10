const bcrypt = require('bcrypt')

function encrypt (password, cb) {
  bcrypt.hash(password, 10).then(function (hash) {
    cb(null, hash)
  }).catch(function (err) {
    cb(err)
  })
}

function preSave (model, fields, next) {
  fields.forEach((name) => {
    if (model.isModified(name)) {
      encrypt(model.get(name), (err, hash) => {
        if (err) return next(err)
        model.set(name, hash)
        next()
      })
    }
  })
}

module.exports = function (schema, options) {
  let fields = []
  schema.eachPath(function (name, type) {
    if (type.options.bcrypt) {
      fields.push(name)
    }
  })

  schema.pre('save', function (next) {
    preSave(this, fields, next)
  })
}
