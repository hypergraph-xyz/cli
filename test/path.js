'use strict'

const { test } = require('tap')
const match = require('stream-match')
const { createEnv } = require('./util')
const { join } = require('path')

// For this action the modules don't need to exist
const hash = '41fac1c7ee0cde5b75ed2de9917a841b3c408dc04e0374a03cb610492f2c486f'

test('path', async t => {
  const { spawn, env } = createEnv()

  const ps = spawn('path')
  await match(ps.stdout, 'Hash')
  ps.stdin.write(`${hash}\n`)
  await match(ps.stdout, join(env, hash))
})

test('path <hash>', async t => {
  const { exec, env } = createEnv()

  const { stdout } = await exec(`path ${hash}`)
  t.equal(stdout.trim(), join(env, hash))
})
