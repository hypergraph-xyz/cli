'use strict'

const { join } = require('path')
const prompt = require('../lib/prompt')
const { encode } = require('dat-encoding')

module.exports = {
  title: 'Print module path',
  unlisted: true,
  p2p: false,
  input: [
    {
      name: 'hash',
      resolve: () =>
        prompt({
          type: 'text',
          message: 'Hash'
        })
    }
  ],
  handler: async ({ hash, env }) => {
    console.log(join(env, encode(hash)))
  }
}
