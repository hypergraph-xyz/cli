'use strict'

const UserError = require('../lib/user-error')

const settings = {
  vaultUrl: 'Vault URL'
}

exports.title = 'Change hypergraph configuration'
exports.unlisted = true
exports.p2p = false
exports.input = [
  {
    name: 'key'
  },
  {
    name: 'value'
  }
]
exports.handler = async ({ key, value, config }) => {
  if (!settings[key]) {
    throw new UserError(
      `Available settings: ${Object.keys(settings).join(', ')}`
    )
  }

  if (value) {
    await config.set(key, value)
  } else {
    console.log(config.get(key))
  }
}
