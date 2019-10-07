#!/usr/bin/env node
'use strict'

const libscie = require('libscie-api')
const meow = require('meow')
const prompts = require('prompts')

const cli = meow(`
  Usage
    $ libscie <action> <input>

  Options
    --env, -e  Custom environment (defaults to ~/.libscie/)

  Examples
      $ libscie                 [interactive mode]
`, {
  flags: {
    env: {
      type: 'string',
      alias: 'e'
    }
  }
})

// env checks
if (!cli.flags.env) cli.flags.env = '/home/chjh/.libscie'

// if no args go full interactive
if (cli.input.length === 0) {
  (async () => {
    const action = await askAction()
    if (action === 'init') {
      const type = await askType()
      const meta = await askMeta()

      libscie.init(type,
        cli.flags.env,
        meta.title,
        meta.description)
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
  })()
}

// add semi-interactive depending on amount of args need to add
if (cli.input.length === 1) {}

// non-interactive to allow for scripting scripting will be worthwhile
// to simulate whole environments on the fly

/// //////////////////////////////////////////////////////

// can export all askX to ./lib/ask.js
// not now
async function askAction () {
  const qs = {
    type: 'select',
    name: 'action',
    message: 'Pick an action',
    choices: [
      { title: 'Initialize', value: 'init' },
      { title: 'Register', value: 'reg' },
      { title: 'Cache', value: 'cache' }
    ],
    initial: 0
  }

  const res = await prompts(qs)
  return res.action
}

async function askType () {
  const qs = {
    type: 'select',
    name: 'type',
    message: 'Pick a type',
    choices: [
      { title: 'Module', value: 'module' },
      { title: 'Profile', value: 'profile' }
    ],
    initial: 0
  }

  const res = await prompts(qs)
  return res.type
}

async function askMeta () {
  const qs = [
    {
      type: 'text',
      name: 'title',
      message: 'Title'
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description'
    }]

  const res = await prompts(qs)
  return res
}

async function select (type, env) {
  const cache = await libscie.readCache(env)

  const choices = cache.filter(mod => mod.type === type & mod.isOwner)
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
  const qs = [
    {
      type: 'autocomplete',
      name: 'register',
      message: 'Pick a module to register',
      choices: modopts
    },
    {
      type: 'autocomplete',
      name: 'registerTo',
      message: 'Pick a profile to register to',
      choices: profopts
    }
  ]

  const res = await prompts(qs)
  return res
}
