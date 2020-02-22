'use strict'

const log = require('../lib/log')

exports.title = 'Log out'
exports.help = `
  Usage
    $ hypergraph logout

  Examples
    $ hypergraph logout                Log out
`
exports.p2p = false
exports.handler = async ({ config }) => {
  await config.set('vaultToken', '')
  log.success('Successfully logged out')
}
