require('dotenv').config()
const path = require('path')
// const favicon = require('serve-favicon')
const compress = require('compression')
const helmet = require('helmet')
const cors = require('cors')
const logger = require('./logger')

const feathers = require('@feathersjs/feathers')
const configuration = require('@feathersjs/configuration')
const express = require('@feathersjs/express')
const socketio = require('@feathersjs/socketio')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')
const channels = require('./channels')

const authentication = require('./authentication')

const knex = require('./knex')

const app = express(feathers())

// Require `Nuxt` And `Builder` modules
const { Nuxt, Builder } = require('nuxt')
// Require Nuxt config
const config = require('../resources/nuxt.config.js')

async function start() {
  config.srcDir = path.resolve(__dirname, '../resources')
  config.dev = process.env.NODE_ENV !== 'production'
  // process.env.DEBUG = 'nuxt:*'
  // Create a new Nuxt instance
  const nuxt = new Nuxt(config)

  if (config.dev) {
    // Enable live build & reloading on dev
    await new Builder(nuxt).build()
  } else {
    // Make sure to wait for Nuxt to load modules before proceeding
    await nuxt.ready()
  }

  // Load app configuration
  app.configure(configuration()).use(nuxt.render)
  // Enable security, CORS, compression, favicon and body parsing
  app.use(helmet())
  app.use(cors())
  app.use(compress())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  // app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
  // Host the public folder
  // app.use('/', express.static(app.get('public')));

  // Set up Plugins and providers
  app.configure(express.rest())
  app.configure(socketio())

  app.configure(knex)

  // Configure other middleware (see `middleware/index.js`)
  app.configure(middleware)
  app.configure(authentication)
  // Set up our services (see `services/index.js`)
  app.configure(services)
  // Set up event channels (see channels.js)
  app.configure(channels)

  // Configure a middleware for 404s and the error handler
  app.use(express.notFound())
  app.use(express.errorHandler({ logger }))

  app.hooks(appHooks)

  return await new Promise((resolve, reject) => {
    resolve(app)
    reject(error => console.error(error))
  })
}

module.exports = start()
