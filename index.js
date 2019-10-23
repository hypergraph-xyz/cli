#!/usr/bin/env node
'use strict'

const prompt = require('./lib/prompt')
const { resolve } = require('path')
const capitalize = require('capitalize')
const open = require('open')
const { homedir } = require('os')
const P2P = require('./lib/p2p')

const actions = {}

actions.create = {
  title: 'Create a module',
  input: [{ name: 'type', resolve: askType }],
  handler: async (p2p, { type, title, name, description }) => {
    if (type === 'content' && !title) {
      title = await prompt({
        type: 'text',
        message: 'Title'
      })
    } else if (type === 'profile' && !name) {
      name = await prompt({
        type: 'text',
        message: 'Name'
      })
    }
    if (!description) {
      description = await prompt({
        type: 'text',
        message: 'Description'
      })
    }

    const { url } = await p2p.init({ type, title, name, description })
    console.log(url)
  }
}

actions.read = {
  title: 'Read metadata',
  input: [
    {
      name: 'hash',
      resolve: () =>
        prompt({
          type: 'text',
          message: 'Hash'
        })
    },
    { name: 'key' }
  ],
  handler: async (p2p, { hash, key }) => {
    const metadata = await p2p.get(hash)
    if (key) {
      console.log(JSON.stringify(metadata[key]))
    } else {
      console.log(JSON.stringify(metadata, null, 2))
    }
  }
}

actions.update = {
  title: 'Update metadata',
  input: [
    {
      name: 'hash',
      resolve: () =>
        prompt({
          type: 'text',
          message: 'Hash'
        })
    },
    { name: 'key' },
    { name: 'value' }
  ],
  handler: async (p2p, { hash, key, value }) => {
    const metadata = await p2p.get(hash)

    if (key) {
      metadata[key] = value || ''
    } else {
      for (const key of p2p.allowedKeyUpdates(metadata.type)) {
        metadata[key] = await prompt({
          type: 'text',
          message: capitalize(key),
          initial: metadata[key]
        })
      }
    }

    await p2p.set(metadata)
  }
}

actions.open = {
  title: 'Open module folder',
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
    // istanbul ignore next
    await open(`${env}/${hash}`)
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
      console.log(rawJSON.url)
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

  const action = actions[actionName]
  const input = {}
  for (const [idx, { name, resolve }] of Object.entries(action.input)) {
    input[name] = rawInput[idx] || (resolve && (await resolve()))
  }

  const env = argv.env ? resolve(argv.env) : `${homedir()}/.p2pcommons`
  const p2p = new P2P({ baseDir: env })
  await p2p.ready()
  await action.handler(p2p, { ...argv, ...input, env })
  await p2p.destroy()
}

module.exports = hypergraph
