#!/usr/bin/env node
'use strict'

const libscie = require('libscie-api')
const meow = require('meow')
const prompt = require('../lib/prompt')
const { homedir } = require('os')

const cli = meow(
  `
  Usage
    $ libscie <action> <input>

  Options
    --env, -e  Custom environment (defaults to ~/.libscie/)

  Examples
      $ libscie                 [interactive mode]
`,
  {
    flags: {
      env: {
        type: 'string',
        alias: 'e',
        default: `${homedir()}/.libscie`
      }
    }
  }
)

const main = async () => {
  let [action, ...input] = cli.input
  if (!action) action = await askAction()

  if (action === 'init') {
    const type = input[0] || (await askType())
    const { title, description } = await askMeta()

    libscie.init(type, cli.flags.env, title, description)
  }

  if (action === 'cache') {
    libscie.buildCache(cli.flags.env)
  }

  if (action === 'reg') {
    const answer = await askReg(cli.flags.env)
    const module = answer.register
    const profile = answer.registerTo
    // register latest version to profile
    libscie.reg(module, profile, cli.flags.env)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

/// //////////////////////////////////////////////////////

// can export all askX to ./lib/ask.js
// not now
function askAction () {
  return prompt({
    type: 'select',
    message: 'Pick an action',
    choices: [
      { title: 'Initialize', value: 'init' },
      { title: 'Register', value: 'reg' },
      { title: 'Cache', value: 'cache' }
    ]
  })
}

function askType () {
  return prompt({
    type: 'select',
    message: 'Pick a type',
    choices: [
      { title: 'Module', value: 'module' },
      { title: 'Profile', value: 'profile' }
    ]
  })
}

async function askMeta () {
  const title = await prompt({
    type: 'text',
    message: 'Title'
  })
  const description = await prompt({
    type: 'text',
    message: 'Description'
  })
  return { title, description }
}

async function select (type, env) {
  const cache = await libscie.readCache(env)

  const choices = cache
    .filter(mod => (mod.type === type) & mod.isOwner)
    .map(choice => {
      const obj = {}
      obj.title = choice.title
      obj.value = choice.hash

      return obj
    })

  return choices
}

async function askReg (env) {
  const modopts = await select('module', env)
  const profopts = await select('profile', env)
  // if opts empty (either) then throw error to build cache

  // might improve the autocomplete by using fuzzy search
  // doable with the suggest function
  // https://github.com/terkelg/prompts#autocompletemessage-choices-initial-suggest-limit-style
  const register = await prompt({
    type: 'autocomplete',
    message: 'Pick a module to register',
    choices: modopts
  })
  const registerTo = await prompt({
    type: 'autocomplete',
    message: 'Pick a profile to register to',
    choices: profopts
  })

  return { register, registerTo }
}
