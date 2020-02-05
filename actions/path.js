'use strict'

const { join } = require('path')
const prompt = require('../lib/prompt')
const { encode } = require('dat-encoding')

module.exports = {
  title: 'Print module path',
  unlisted: true,
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
  handler: async (_, { hash, env }) => {
    console.log(join(env, encode(hash)))
  }
}
