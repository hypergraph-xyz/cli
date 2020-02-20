'use strict'

const open = require('open')
const prompt = require('../lib/prompt')
const { encode } = require('dat-encoding')

exports.title = 'Open module folder'
exports.input = [{ name: 'hash', resolve: prompt.modules }]
// istanbul ignore next
exports.handler = async ({ hash, env }) => {
  await open(`${env}/${encode(hash)}`)
}
