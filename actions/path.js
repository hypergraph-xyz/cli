'use strict'

const { join } = require('path')
const prompt = require('../lib/prompt')
const { encode } = require('dat-encoding')

exports.title = 'Print module path'
exports.help = `
  Usage
    $ hypergraph path [hash]

  Examples
    $ hypergraph path                  Interactive mode
    $ hypergraph path URL              Print module path
`
exports.unlisted = true
exports.p2p = false
exports.input = [
  {
    name: 'hash',
    resolve: () =>
      prompt({
        type: 'text',
        message: 'Hash'
      })
  }
]
exports.handler = async ({ hash, env }) => {
  console.log(join(env, encode(hash)))
}
