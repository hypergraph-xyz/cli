'use strict'

const UserError = require('../lib/user-error')

const settings = {
  vaultUrl: 'Vault URL'
}

module.exports = {
  title: 'Change hypergraph configuration',
  private: true,
  p2p: false,
  input: [
    {
      name: 'key'
    },
    {
      name: 'value'
    }
  ],
  handler: async ({ key, value, config }) => {
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
}
