'use strict'

const { test } = require('tap')
const match = require('stream-match')
const { createEnv } = require('./util')

test('open', async t => {
  const { exec, spawn } = createEnv()
  await exec('create content -t=t -d=d -y')
  const ps = spawn('open')
  await match(ps.stdout, 'Select module')
  ps.kill()
})
