'use strict'

const prompt = require('../lib/prompt')
const UserError = require('../lib/user-error')
const kleur = require('kleur')
const log = require('../lib/log')

module.exports = {
  title: 'Delete a content module',
  input: [
    {
      name: 'hash',
      resolve: async p2p => {
        const mods = await p2p.listContent()
        const writable = mods.filter(mod => mod.metadata.isWritable)
        if (!writable.length) throw new UserError('No writable content modules')
        return prompt({
          type: 'select',
          message: 'Select module',
          choices: writable.map(({ rawJSON }) => ({
            title: rawJSON.title,
            value: rawJSON.url
          }))
        })
      }
    }
  ],
  handler: async ({ p2p, hash, yes }) => {
    const mod = await p2p.get(hash)
    if (!yes) {
      const confirmed = await prompt({
        type: 'confirm',
        message: `Delete "${mod.rawJSON.title}"?`,
        // the default gray wasn't always readable
        noOption: kleur.reset('(y/N)')
      })
      if (!confirmed) throw new UserError('Delete not confirmed')
    }
    await p2p.delete(hash)
    log.success('Module deleted')
  }
}
