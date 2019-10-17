'use strict'

const prompts = require('prompts')

class Abort extends Error {}

const prompt = async qs => {
  const res = await prompts({
    ...qs,
    name: 'default'
  })
  if (typeof res.default === 'undefined') throw new Abort()
  return res.default
}

module.exports = prompt
module.exports.Abort = Abort
