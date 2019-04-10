const _ = require('lodash')
const merge = require('utils-merge')

module.exports = function (app, options) {
  app.render = render
}

/**
 * @see https://github.com/expressjs/express/blob/master/lib/application.js#L514-L593
 * @private
 */
function render (name, options, callback) {
  var cache = this.cache
  var done = callback
  var engines = this.engines
  var opts = options
  var renderOptions = {}
  var view

  // support callback function as second arg
  if (typeof options === 'function') {
    done = options
    opts = {}
  }

  // merge app.locals
  merge(renderOptions, this.locals)

  // merge options._locals
  if (opts._locals) {
    merge(renderOptions, opts._locals)
  }

  // merge options
  merge(renderOptions, opts)

  // set .cache unless explicitly provided
  if (renderOptions.cache == null) {
    renderOptions.cache = this.enabled('view cache')
  }

  // primed cache
  if (renderOptions.cache) {
    view = cache[name]
  }

  // view
  if (view) {
    return tryRender(view, renderOptions, callback)
  }

  var View = this.get('view')

  var { namespace, name } = parseName(name)

  view = new View(name, {
    defaultEngine: this.get('view engine'),
    root: resolveRoot(namespace, this.get('views')),
    engines: engines
  })

  if (!view.path) {
    return done(createError(name, view))
  }

  // prime the cache
  if (renderOptions.cache) {
    cache[name] = view
  }

  tryRender(
    view, renderOptions, callback
  )
}

function parseName(name) {
  if (name.includes('::')) {
    return _.zipObject(['namespace', 'name'], name.split('::'))
  } else {
    return { namespace: '_default', name}
  }
}

function resolveRoot(namespace, views) {
  if (typeof views === 'object') {
    return views[namespace]
  } else {
    return views
  }
}

function createError(name, view) {
  var dirs = rootToMessage(view.root)
  var err = new Error('Failed to lookup view "' + name + '" in views ' + dirs)
  err.view = view
  return err
}

function rootToMessage(root) {
  if (Array.isArray(root) && root.length > 1) {
    return 'directories "' + root.slice(0, -1).join('", "') + '" or "' + root[root.length - 1] + '"'
  } else {
    return 'directory "' + root + '"'
  }
}

/**
 * Try rendering a view.
 * @private
 */
function tryRender(view, options, callback) {
  try {
    view.render(options, callback)
  } catch (err) {
    callback(err)
  }
}
