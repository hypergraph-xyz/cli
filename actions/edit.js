'use strict'

const UserError = require('../lib/user-error')
const Editor = require('@hypergraph-xyz/editor')
const prompt = require('../lib/prompt')
const ora = require('ora')
const { encode } = require('dat-encoding')

const htmlRegex = /\.html?$/

module.exports = {
  title: 'Edit main file',
  input: [
    {
      name: 'hash',
      resolve: async p2p => {
        const mods = await p2p.list()
        if (!mods.length) throw new UserError('No modules')
        const writable = mods.filter(mod => mod.metadata.isWritable)
        return prompt({
          type: 'select',
          message: 'Select writable module',
          warn: 'Only HTML is currently supported',
          choices: writable.map(({ rawJSON }) => ({
            title: rawJSON.title,
            value: rawJSON.url,
            disabled: rawJSON.main && !htmlRegex.test(rawJSON.main)
          }))
        })
      }
    }
  ],
  handler:
    // istanbul ignore next
    async (p2p, { hash, env }) => {
      const mod = await p2p.get(hash)
      let main = mod.rawJSON.main
      if (main) {
        if (!htmlRegex.test(main)) {
          throw new UserError('Only HTML is currently supported')
        }
      } else {
        main = 'main.html'
        await p2p.set({ url: mod.rawJSON.url, main })
      }
      const editor = new Editor(`${env}/${encode(hash)}/${main}`)
      editor.open()
      ora('Press CTRL+C when done editing.').start()
    }
}
