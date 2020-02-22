'use strict'

const open = require('open')
const UserError = require('../lib/user-error')
const { encode } = require('dat-encoding')
const prompt = require('../lib/prompt')

exports.title = 'Open main file'
exports.help = `
  Usage
    $ hypergraph main [hash]

  Examples
    $ hypergraph main                  Interactive mode
    $ hypergraph main URL              Open main file
`
exports.input = [
  {
    name: 'hash',
    resolve: async p2p => {
      const mods = await p2p.list()
      const withMain = mods.filter(({ rawJSON }) => rawJSON.main)
      if (!withMain.length) throw new UserError('No modules with main files')
      return prompt({
        type: 'select',
        message: 'Select module',
        choices: withMain.map(({ rawJSON }) => ({
          title: rawJSON.title,
          value: rawJSON.url
        }))
      })
    }
  }
]
// istanbul ignore next
exports.handler = async ({ p2p, hash, env }) => {
  const mod = await p2p.get(hash)
  await open(`${env}/${encode(hash)}/${mod.rawJSON.main}`)
}
