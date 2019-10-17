#!/usr/bin/env node
'use strict'

process.title = 'hypergraph'

require('fs.promises')

const P2PCommons = require('@p2pcommons/sdk-js')
const minimist = require('minimist')
const prompt = require('../lib/prompt')
const UserError = require('../lib/user-error')

const help = `
  Usage
    $ hypergraph <action> <input>

  Actions
    create <type>                    Create a module
    read   <type> <hash> [key]       Read a module's metadata
    update <type> <hash> [key value] Update a module's metadata

  Options
    --env, -e                        Custom dotfiles path in home directory
                                     (defaults to .p2pcommons)
  
  Module types
    - content                        A content module
    - profile                        A user profile module

  Examples
    $ hypergraph                     [interactive mode]
`

const argv = minimist(process.argv.slice(2), {
  alias: {
    env: 'e',
    help: 'h'
  }
})

if (argv.help) {
  console.log(help)
  process.exit(1)
}

const actions = {}

actions.create = {
  title: 'Create a module',
  input: [{ name: 'type', resolve: askType }],
  handler: async (p2p, { type }) => {
    const title = await prompt({
      type: 'text',
      message: 'Title'
    })
    const description = await prompt({
      type: 'text',
      message: 'Description'
    })
    const { url } = await p2p.init({ type, title, description })

    console.log(`dat://${url.toString('hex')}`)
  }
}

actions.read = {
  title: 'Read metadata',
  input: [
    { name: 'type', resolve: askType },
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
  handler: async (p2p, { type, hash, key }) => {
    const meta = await p2p.get(type, hash)
    if (key) {
      console.log(JSON.stringify(renderKV(key, meta[key])))
    } else {
      console.log(JSON.stringify(meta, renderKV, 2))
    }
  }
}

actions.update = {
  title: 'Update metadata',
  input: [
    { name: 'type', resolve: askType },
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
  handler: async (p2p, { type, hash, key, value }) => {
    const meta = await p2p.get(type, hash)

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
          message: key,
          initial: meta[key]
        })
      }
    }

    await p2p.set(meta)
  }
}

const allowedKeyUpdates = ['title', 'description', 'main']
class InvalidKeyError extends UserError {}

const renderKV = (key, value) => {
  return key === 'url' ? `dat://${Buffer.from(value).toString('hex')}` : value
}

const main = async () => {
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

  const p2p = new P2PCommons({ baseDir: argv.env })
  await p2p.ready()
  await action.handler(p2p, input)
  await p2p.destroy()
}

main().catch(err => {
  // istanbul ignore next
  if (err instanceof UserError) {
    if (err.message) console.error(err.message)
  } else {
    console.error(err)
  }

  process.exit(1)
})

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
