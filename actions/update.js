'use strict'

const prompt = require('../lib/prompt')
const readdirp = require('readdirp')
const validate = require('../lib/validate')
const UserError = require('../lib/user-error')
const { encode } = require('dat-encoding')

exports.title = 'Update metadata'
exports.input = [
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
]
exports.handler = async ({ p2p, env, hash, key, value }) => {
  const update = { url: hash }

  if (key) {
    update[key] = value || ''
    if (key === 'parents') {
      update[key] = update[key].split(',').filter(Boolean)
    }
  } else {
    const { rawJSON } = await p2p.get(hash)

    if (rawJSON.type === 'content') {
      // title
      update.title = await prompt({
        type: 'text',
        message: 'Title',
        initial: rawJSON.title,
        validate: validate.title
      })
    } else {
      // name
      update.name = await prompt({
        type: 'text',
        message: 'Name',
        initial: rawJSON.name,
        validate: validate.name
      })
    }

    // description
    update.description = await prompt({
      type: 'text',
      message: 'Description',
      initial: rawJSON.description
    })

    // main
    const entries = await readdirp.promise(`${env}/${encode(rawJSON.url)}/`, {
      fileFilter: ['!index.json', '!.*'],
      directoryFilter: ['.dat']
    })
    if (entries.length) {
      update.main = await prompt({
        type: 'select',
        message: 'Main',
        choices: entries.map(entry => ({
          title: entry.path,
          value: entry.path
        }))
      })
    } else {
      console.log('No main file to set available')
    }

    if (rawJSON.type === 'content') {
      // subtype
      update.subtype = await prompt.subType(rawJSON.subtype)

      // parents
      const published = await p2p.listPublished()
      const potentialParents = published
        .filter(mod => mod.rawJSON.url !== rawJSON.url)
        .sort((a, b) => a.rawJSON.title.localeCompare(b.rawJSON.title))
      if (potentialParents.length) {
        update.parents = await prompt({
          type: 'multiselect',
          message: 'Parents',
          choices: potentialParents.map(mod => ({
            title: mod.rawJSON.title,
            value: mod.rawJSON.url,
            selected: rawJSON.parents.includes(mod.rawJSON.url)
          }))
        })
      } else {
        console.log('No parent module to set available')
      }
    }
  }

  await p2p.set(update)
}
