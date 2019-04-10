const path = require('path')

const BASE_PATH = path.resolve(process.cwd(), '..')

const FRONT_PATH = path.resolve(BASE_PATH, 'front')
const SERVER_PATH = path.resolve(BASE_PATH, 'server')

const CONFIG_PATH = path.resolve(SERVER_PATH, 'config')
const STORAGE_PATH = path.resolve(SERVER_PATH, 'storage')

module.exports = {
  BASE_PATH,
  FRONT_PATH, SERVER_PATH,
  CONFIG_PATH, STORAGE_PATH
}
