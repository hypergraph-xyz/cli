'use strict'

require('./fs-promises')
const { promises: fs } = require('fs')

const defaults = {
  vaultUrl: 'http://localhost:8080'
}

class Config {
  constructor (env) {
    this.path = `${env}/hypergraph.json`
  }

  async load () {
    let config = {}
    try {
      const text = await fs.readFile(this.path)
      config = JSON.parse(text.toString())
    } catch (_) {}
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in config)) {
        config[key] = value
      }
    }
    return config
  }

  async store (config) {
    await fs.writeFile(this.path, JSON.stringify(config, null, 2))
  }

  async get (key) {
    const config = await this.load()
    return config[key]
  }

  async set (key, value) {
    const config = await this.load()
    config[key] = value
    await this.store(config)
  }
}

module.exports = Config
