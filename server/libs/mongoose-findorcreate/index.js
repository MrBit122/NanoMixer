module.exports = function (schema) {
  schema.statics.findOneOrCreate = async function findOneOrCreate(condition, document, callback) {
    const self = this
    self.findOne(condition, (err, result) => {
      return result ? callback(err, result) : self.create(Object.assign({}, condition, document), callback)
    })
  }
}
