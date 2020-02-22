'use strict'

const prompt = require('../lib/prompt')

exports.title = 'List writable modules'
exports.unlisted = true
exports.input = [{ name: 'type', resolve: prompt.type }]
exports.handler = async ({ p2p, type }) => {
  const fn = {
    content: 'listContent',
    profile: 'listProfiles'
  }[type]
  const dbItems = await p2p[fn]()
  for (const { rawJSON } of dbItems) {
    console.log(rawJSON.title)
  }
}
