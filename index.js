#!/usr/bin/env node
'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')
const prompt = require('./lib/prompt')
const UserError = require('./lib/user-error')
const { resolve } = require('path')
const { encode, decode } = require('dat-encoding')
const capitalize = require('capitalize')

const actions = {}

actions.create = {
  title: 'Create a module',
  input: [{ name: 'type', resolve: askType }],
  handler: async (p2p, { type, title, description }) => {
    if (!title) {
      title = await prompt({
        type: 'text',
        message: 'Title'
      })
    }
    if (!description) {
      description = await prompt({
        type: 'text',
        message: 'Description'
      })
    }
    const { url } = await p2p.init({ type, title, description })

    console.log(`dat://${encode(url)}`)
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
    const meta = await p2p.get(decode(hash))
    const out = {
      ...meta,
      url: `dat://${encode(meta.url)}`
    }
    if (key) {
      console.log(JSON.stringify(out[key]))
    } else {
      console.log(JSON.stringify(out, null, 2))
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
    const meta = await p2p.get(decode(hash))

    if (key) {
      if (!allowedKeyUpdates.includes(key)) {
        throw new InvalidKeyError(
          `Only allowed to update keys ${allowedKeyUpdates.join(', ')}`
        )
      }
      meta[key] = value || ''
    } else {
      for (const key of allowedKeyUpdates) {
        meta[key] = await prompt({
          type: 'text',
          message: capitalize(key),
          initial: meta[key]
        })
      }
    }

    await p2p.set(meta)
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
    for (const { rawJSON: mod } of dbItems) {
      console.log(`dat://${mod.url.toString('hex')}`)
    }
  }
}

const allowedKeyUpdates = ['title', 'description', 'main']
class InvalidKeyError extends UserError {}

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

  const p2p = new P2PCommons({ baseDir: argv.env && resolve(argv.env) })
  await p2p.ready()
  await action.handler(p2p, { ...argv, ...input })
  await p2p.destroy()
}

module.exports = hypergraph
