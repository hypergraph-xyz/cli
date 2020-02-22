'use strict'

const prompt = require('../lib/prompt')

exports.title = 'List writable modules'
exports.help = `
  Usage
    $ hypergraph list [type]

  Module types
    - content                          A content module
    - profile                          A user profile module

  Examples
    $ hypergraph list                  Interactive mode
    $ hypergraph list content          List content modules
    $ hypergraph list profile          List profile modules
`
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
