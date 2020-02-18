'use strict'

const chalk = require('chalk')

module.exports = {
  title: 'Log out',
  p2p: false,
  handler: async ({ config }) => {
    await config.set('vaultToken', '')
    console.log(`${chalk.green('✔')} Successfully logged out`)
  }
}
