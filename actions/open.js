'use strict'

const open = require('open')
const prompt = require('../lib/prompt')
const { encode } = require('dat-encoding')

module.exports = {
  title: 'Open module folder',
  input: [{ name: 'hash', resolve: prompt.modules }],
  handler:
    // istanbul ignore next
    async (_, { hash, env }) => {
      await open(`${env}/${encode(hash)}`)
    }
}
