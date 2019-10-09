'use strict'

const prompts = require('prompts')

const prompt = async qs => {
  const res = await prompts({
    ...qs,
    name: 'default'
  })
  if (typeof res.default === 'undefined') process.exit(1)
  return res.default
}

module.exports = prompt
