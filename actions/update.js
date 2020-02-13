'use strict'

const prompt = require('../lib/prompt')
const readdirp = require('readdirp')
const validate = require('../lib/validate')
const capitalize = require('capitalize')
const UserError = require('../lib/user-error')
const { encode } = require('dat-encoding')

module.exports = {
  title: 'Update metadata',
  input: [
    {
      name: 'hash',
      resolve: async p2p => {
        const mods = await p2p.list()
        const writable = mods.filter(mod => mod.metadata.isWritable)
        if (!writable.length) throw new UserError('No writable modules')
        return prompt({
          type: 'select',
          message: 'Select module',
          choices: writable.map(({ rawJSON }) => ({
            title: rawJSON.title,
            value: rawJSON.url
          }))
        })
      }
    },
    { name: 'key' },
    { name: 'value' }
  ],
  handler: async ({ p2p, env, hash, key, value }) => {
    const update = { url: hash }

    if (key) {
      update[key] = value || ''
      if (key === 'parents') update[key] = update[key].split(',')
    } else {
      const { rawJSON } = await p2p.get(hash)
      const keys = [
        rawJSON.type === 'content' ? 'title' : 'name',
        'description',
        'main'
      ]
      if (rawJSON.type === 'content') {
        keys.push('subtype')
        keys.push('parents')
      }

      for (const key of keys) {
        if (key === 'main') {
          const entries = await readdirp.promise(
            `${env}/${encode(rawJSON.url)}/`,
            {
              fileFilter: ['!dat.json', '!.*'],
              directoryFilter: ['.dat']
            }
          )
          if (!entries.length) {
            console.log('No main file to set available')
            continue
          }
          update.main = await prompt({
            type: 'select',
            message: 'Main',
            choices: entries.map(entry => ({
              title: entry.path,
              value: entry.path
            }))
          })
        } else if (key === 'subtype') {
          update.subtype = await prompt.subType(rawJSON.subtype)
        } else if (key === 'parents') {
          const published = await p2p.listPublished()
          const choices = published.map(mod => ({
            title: mod.rawJSON.title,
            value: mod.rawJSON.url,
            selected: rawJSON.parents.includes(mod.rawJSON.url)
          }))
          if (choices.length) {
            update.parents = await prompt({
              type: 'multiselect',
              message: 'Parents',
              choices
            })
          }
        } else {
          update[key] = await prompt({
            type: 'text',
            message: capitalize(key),
            initial: rawJSON[key],
            validate: validate[key]
          })
        }
      }
    }

    await p2p.set(update)
  }
}
