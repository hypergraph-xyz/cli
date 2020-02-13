'use strict'

const prompt = require('../lib/prompt')

module.exports = {
  title: 'List writable modules',
  unlisted: true,
  input: [{ name: 'type', resolve: prompt.type }],
  handler: async ({ p2p, type }) => {
    const fn = {
      content: 'listContent',
      profile: 'listProfiles'
    }[type]
    const dbItems = await p2p[fn]()
    for (const { rawJSON } of dbItems) {
      console.log(rawJSON.title)
    }
  }
}
