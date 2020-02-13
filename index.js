#!/usr/bin/env node
'use strict'

const { resolve } = require('path')
const { homedir } = require('os')
const P2P = require('./lib/p2p')
const ora = require('ora')
const actions = require('./actions')
const prompt = require('./lib/prompt')
const Config = require('./lib/config')

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
  const action = actions[actionName]
  const env = argv.env ? resolve(argv.env) : `${homedir()}/.p2pcommons`
  const config = new Config(env)

  let p2p
  if (action.p2p !== false) {
    p2p = new P2P({ baseDir: env, disableSwarm: process.env.CI })
    await p2p.ready()
  }

  const input = {}
  for (const [idx, { name, resolve }] of Object.entries(action.input)) {
    input[name] = rawInput[idx] || (resolve && (await resolve(p2p, { env })))
  }

  await action.handler({ p2p, ...argv, ...input, env, config })

  if (action.p2p !== false) {
    const spinner = ora('Synchronizing network').start()
    await p2p.destroy()
    spinner.stop()
  }
}

module.exports = hypergraph
