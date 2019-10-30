#!/usr/bin/env node
'use strict'

const prompt = require('./lib/prompt')
const { resolve } = require('path')
const capitalize = require('capitalize')
const open = require('open')
const { homedir } = require('os')
const P2P = require('./lib/p2p')
const { encode } = require('dat-encoding')
const readdirp = require('readdirp')
const validate = require('./lib/validate')
const UserError = require('./lib/user-error')
const subtypes = require('./lib/subtypes')

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
    if (!description) {
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
          'License: https://creativecommons.org/publicdomain/zero/1.0/legalcode'
      })
      if (!confirmed) throw new UserError('License not confirmed')
    }

    console.log({ type, title, name, description, subtype })
    const { url } = await p2p.init({ type, title, name, description, subtype })
    console.log(url)
  }
}

actions.read = {
  title: 'Read metadata',
  input: [{ name: 'hash', resolve: askModules }, { name: 'key' }],
  handler: async (p2p, { hash, key }) => {
    const metadata = await p2p.get(hash)
    if (key) {
      console.log(JSON.stringify(format(key, metadata[key])))
    } else {
      console.log(JSON.stringify(metadata, format, 2))
    }
  }
}

const format = (key, value) => (key === 'url' ? `dat://${value}` : value)

actions.update = {
  title: 'Update metadata',
  input: [
    {
      name: 'hash',
      resolve: async p2p => {
        const mods = await p2p.list()
        const writable = mods.filter(({ isWritable }) => isWritable)
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
    const metadata = await p2p.get(hash)

    if (key) {
      metadata[key] = value || ''
    } else {
      for (const key of p2p.allowedKeyUpdatesWithTitleRename(metadata.type)) {
        if (key === 'main') {
          const entries = await readdirp.promise(
            `${env}/${encode(metadata.url)}/`,
            {
              fileFilter: ['!dat.json', '!.*'],
              directoryFilter: ['.dat']
            }
          )
          if (!entries.length) continue
          metadata.main = await prompt({
            type: 'select',
            message: 'Main',
            choices: entries.map(entry => ({
              title: entry.path,
              value: entry.path
            }))
          })
        } else if (key === 'subtype') {
          metadata.subtype = await askSubtype(metadata.subtype)
        } else {
          metadata[key] = await prompt({
            type: 'text',
            message: capitalize(key),
            initial: metadata[key],
            validate: validate[key]
          })
        }
      }
    }

    await p2p.set(metadata)
  }
}

actions.open = {
  title: 'Open module folder',
  input: [{ name: 'hash', resolve: askModules }],
  handler: async (_, { hash, env }) => {
    // istanbul ignore next
    await open(`${env}/${encode(hash)}`)
  }
}

actions.path = {
  title: 'Print module path',
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
    console.log(`${env}/${encode(hash)}`)
  }
}

actions.list = {
  title: 'List writable modules',
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

function askSubtype (current) {
  const idx = subtypes.indexOf(current)
  return prompt({
    type: 'select',
    message: 'Select subtype',
    choices: subtypes.map(subtype => ({ title: subtype, value: subtype })),
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
      choices: Object.entries(actions).map(([value, { title }]) => ({
        title,
        value
      }))
    })
  }

  const env = argv.env
    ? resolve(argv.env)
    : /* istanbul ignore next */ `${homedir()}/.p2pcommons`
  const p2p = new P2P({ baseDir: env })
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
