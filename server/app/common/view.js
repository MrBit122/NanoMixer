const path = require('path')
const BaseView = require('express/lib/view')

const dirname = path.dirname
const basename = path.basename
const resolve = path.resolve

module.exports = View

function View () {
  BaseView.apply(this, arguments)
  this.basedir = this.resolveBasedir()
}

View.prototype = Object.create(BaseView.prototype)
View.prototype.constructor = View

/**
 * Resolve the basedir.
 *
 * @private
 */

View.prototype.resolveBasedir = function () {
  if (!this.path) return null

  var roots = [].concat(this.root)

  for (var i = 0; i < roots.length; i++) {
    if (this.path.startsWith(roots[i])) {
      return roots[i];
    }
  }
}

/**
 * Render with the given options.
 *
 * @param {object} options
 * @param {function} callback
 * @private
 */

View.prototype.render = function (options, callback) {
  options.basedir = this.basedir
  return BaseView.prototype.render.apply(this, arguments)
}
