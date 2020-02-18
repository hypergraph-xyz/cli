'use strict'

require('./fs-promises')
const { promises: fs, readFileSync } = require('fs')

class Config {
  constructor (env) {
    this.path = `${env}/hypergraph.json`
    this.config = {}
    this.load()
  }

  load () {
    try {
      const text = readFileSync(this.path)
      this.config = JSON.parse(text.toString())
    } catch (_) {}
  }

  get (key) {
    return this.config[key]
  }

  async set (key, value) {
    this.config[key] = value
    await fs.writeFile(this.path, JSON.stringify(this.config, null, 2))
  }
}

module.exports = Config
