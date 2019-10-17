'use strict'

const prompts = require('prompts')
const UserError = require('./user-error')

class AbortError extends UserError {}

const prompt = async qs => {
  const res = await prompts({
    ...qs,
    name: 'default'
  })
  if (typeof res.default === 'undefined') throw new AbortError()
  return res.default
}

module.exports = prompt
