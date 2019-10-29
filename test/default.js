'use strict'

const { test } = require('tap')
const match = require('stream-match')
const { version } = require('../package')
const { createEnv, onExit } = require('./util')

test('--help', async t => {
  const { spawn } = createEnv()
  const ps = spawn('--help')
  await match(ps.stdout, 'interactive mode')
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('--version', async t => {
  const { exec } = createEnv()
  const { stdout } = await exec('--version')
  t.ok(stdout.includes(version))
})

test('default', async t => {
  const { spawn } = createEnv()
  const ps = spawn('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const { spawn } = createEnv()
  const ps = spawn('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  const code = await onExit(ps)
  t.equal(code, 1)
})
