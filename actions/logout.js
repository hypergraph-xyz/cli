'use strict'

const log = require('../lib/log')

module.exports = {
  title: 'Log out',
  p2p: false,
  handler: async ({ config }) => {
    await config.set('vaultToken', '')
    log.success('Successfully logged out')
  }
}
