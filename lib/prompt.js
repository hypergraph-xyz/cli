'use strict'

const prompts = require('prompts')
const UserError = require('./user-error')
const subtypes = require('@hypergraph-xyz/wikidata-identifiers')

class AbortError extends UserError {}

const prompt = async qs => {
  const res = await prompts({
    ...qs,
    name: 'default'
  })
  if (typeof res.default === 'undefined') throw new AbortError()
  return res.default
}

prompt.type = () =>
  prompt({
    type: 'select',
    message: 'Select type',
    choices: [
      { title: 'Content', value: 'content' },
      { title: 'Profile', value: 'profile' }
    ]
  })

prompt.subType = currentId => {
  const entries = Object.entries(subtypes)
  const idx = entries.findIndex(([id]) => id === currentId)
  return prompt({
    type: 'autocomplete',
    message: 'Select subtype',
    choices: entries.map(([id, name]) => ({ title: name, value: id })),
    initial: idx === -1 ? 0 : idx
  })
}

prompt.modules = async p2p => {
  const mods = await p2p.list()
  if (!mods.length) throw new UserError('No modules')
  return prompt({
    type: 'select',
    message: 'Select module',
    choices: mods.map(({ rawJSON }) => ({
      title: rawJSON.title,
      value: rawJSON.url
    }))
  })
}

module.exports = prompt
