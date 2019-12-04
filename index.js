#!/usr/bin/env node
'use strict'

const prompt = require('./lib/prompt')
const { resolve, join } = require('path')
const capitalize = require('capitalize')
const open = require('open')
const { homedir } = require('os')
const P2P = require('./lib/p2p')
const { encode } = require('dat-encoding')
const readdirp = require('readdirp')
const validate = require('./lib/validate')
const UserError = require('./lib/user-error')
const subtypes = require('./lib/subtypes')
const kleur = require('kleur')

const actions = {}

actions.create = {
  title: 'Create a module',
  input: [{ name: 'type', resolve: askType }],
  handler: async (p2p, { type, title, name, description, subtype, yes }) => {
    if (type === 'content' && !title) {
      title = await prompt({
        type: 'text',
        message: 'Title',
        validate: validate.title
      })
    } else if (type === 'profile' && !name) {
      name = await prompt({
        type: 'text',
        message: 'Name',
        validate: validate.name
      })
    }
    if (description === undefined) {
      description = await prompt({
        type: 'text',
        message: 'Description'
      })
    }
    if (type === 'content' && !subtype) subtype = await askSubtype()

    if (!yes) {
      const confirmed = await prompt({
        type: 'confirm',
        message:
          'License: https://creativecommons.org/publicdomain/zero/1.0/legalcode',
        // the default gray wasn't always readable
        noOption: kleur.reset('(y/N)')
      })
      if (!confirmed) throw new UserError('License not confirmed')
    }

    if (type === 'profile') {
      const profiles = await p2p.listProfiles()
      if (profiles.find(profile => profile.metadata.isWritable)) {
        throw new UserError('A local profile already exists')
      }
    }

    let authors
    if (type === 'content') {
      const profiles = await p2p.listProfiles()
      if (!profiles.find(profile => profile.metadata.isWritable)) {
        throw new UserError('Create a profile first')
      }
      authors = [profiles[0].rawJSON.url]
    }

    const {
      rawJSON: { url }
    } = await p2p.init({ type, title, name, description, subtype })
    if (authors) {
      await p2p.set({ url, authors })
    }
    console.log(url)
  }
}

const moduleHeader = mod => {
  const type = mod.rawJSON.subtype
    ? subtypes[mod.rawJSON.subtype] || 'Unknown'
    : 'Profile'
  return `${kleur.cyan().bold(mod.rawJSON.title || mod.rawJSON.name)} - ${type}`
}

actions.read = {
  title: 'Read metadata',
  input: [{ name: 'hash', resolve: askModules }],
  handler: async (p2p, { hash }) => {
    const mod = await p2p.get(hash)

    console.log(moduleHeader(mod))

    if (mod.rawJSON.type === 'content') {
      if (mod.rawJSON.authors.length) {
        const authors = await Promise.all(
          mod.rawJSON.authors.map(hash => p2p.get(hash))
        )
        const authorNames = authors.map(author => author.rawJSON.name)
        console.log(kleur.italic(authorNames.join(',')))
      } else {
        console.log(kleur.italic('Anonymous'))
      }
    }

    console.log()
    console.log(kleur.underline(`dat://${mod.rawJSON.url}`))
    if (mod.rawJSON.type === 'content') {
      if (mod.rawJSON.parents.length) {
        console.log(kleur.bold('Parents:'))
        for (const parent of mod.rawJSON.parents) {
          console.log(` - ${parent}`)
        }
      }
    } else {
      if (mod.rawJSON.follows.length) {
        console.log(kleur.bold('Follows:'))
        for (const profile of mod.rawJSON.follows) {
          console.log(` - ${profile}`)
        }
      }
    }
    console.log()

    if (mod.rawJSON.description) {
      console.log(mod.rawJSON.description)
    } else {
      console.log(kleur.gray('No description'))
    }

    console.log()
    if (mod.rawJSON.main) {
      console.log(`main: ${mod.rawJSON.main}`)
    } else {
      console.log(`main: ${kleur.red('✖')}`)
    }

    if (mod.rawJSON.type === 'profile' && mod.rawJSON.contents.length) {
      console.log('contents:')
      for (const contentKey of mod.rawJSON.contents) {
        const content = await p2p.get(contentKey)
        console.log(` - ${moduleHeader(content)}`)
        console.log(`   ${kleur.underline(`dat://${content.rawJSON.url}`)}`)
      }
    }
  }
}

actions.update = {
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
  handler: async (p2p, { env, hash, key, value }) => {
    const update = { url: hash }

    if (key) {
      update[key] = value || ''
    } else {
      const { rawJSON } = await p2p.get(hash)
      const keys = [
        rawJSON.type === 'content' ? 'title' : 'name',
        'description',
        'main'
      ]
      if (rawJSON.type === 'content') keys.push('subtype')

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
          update.subtype = await askSubtype(rawJSON.subtype)
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

actions.open = {
  title: 'Open module folder',
  input: [{ name: 'hash', resolve: askModules }],
  handler:
    // istanbul ignore next
    async (_, { hash, env }) => {
      await open(`${env}/${encode(hash)}`)
    }
}

actions.main = {
  title: 'Open main file',
  input: [
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
  ],
  handler:
    // istanbul ignore next
    async (p2p, { hash, env }) => {
      const mod = await p2p.get(hash)
      await open(`${env}/${encode(hash)}/${mod.rawJSON.main}`)
    }
}

actions.path = {
  title: 'Print module path',
  unlisted: true,
  input: [
    {
      name: 'hash',
      resolve: () =>
        prompt({
          type: 'text',
          message: 'Hash'
        })
    }
  ],
  handler: async (_, { hash, env }) => {
    console.log(join(env, encode(hash)))
  }
}

actions.list = {
  title: 'List writable modules',
  unlisted: true,
  input: [{ name: 'type', resolve: askType }],
  handler: async (p2p, { type }) => {
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

function askType () {
  return prompt({
    type: 'select',
    message: 'Select type',
    choices: [
      { title: 'Content', value: 'content' },
      { title: 'Profile', value: 'profile' }
    ]
  })
}

function askSubtype (currentId) {
  const entries = Object.entries(subtypes)
  const idx = entries.findIndex(([id]) => id === currentId)
  return prompt({
    type: 'autocomplete',
    message: 'Select subtype',
    choices: entries.map(([id, name]) => ({ title: name, value: id })),
    initial: idx === -1 ? 0 : idx
  })
}

async function askModules (p2p) {
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

const hypergraph = async argv => {
  let [actionName, ...rawInput] = argv._
  if (!actionName) {
    actionName = await prompt({
      type: 'select',
      message: 'Pick an action',
      choices: Object.entries(actions)
        .filter(([, { unlisted }]) => !unlisted)
        .map(([value, { title }]) => ({
          title,
          value
        }))
    })
  }

  const env = argv.env
    ? resolve(argv.env)
    : /* istanbul ignore next */ `${homedir()}/.p2pcommons`
  const p2p = new P2P({ baseDir: env, disableSwarm: process.env.CI })
  await p2p.ready()

  const action = actions[actionName]
  const input = {}
  for (const [idx, { name, resolve }] of Object.entries(action.input)) {
    input[name] = rawInput[idx] || (resolve && (await resolve(p2p)))
  }

  await action.handler(p2p, { ...argv, ...input, env })
  await p2p.destroy()
}

module.exports = hypergraph
module.exports.actions = actions
