const requireContext = require('require-context')

const { CONFIG_PATH } = require('./constants')

const files = requireContext(CONFIG_PATH, false, /\.js$/)
const config = {}

files.keys().forEach(key => {
  config[key.replace(/(\.\/|\.js)/g, '')] = files(key)
})

module.exports = config
