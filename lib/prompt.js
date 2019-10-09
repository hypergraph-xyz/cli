'use strict'

const prompts = require('prompts')

const prompt = async qs => {
  const res = await prompts({
    ...qs,
    name: 'default'
  })
  return res.default
}

module.exports = prompt
