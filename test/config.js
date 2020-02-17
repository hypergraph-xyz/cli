'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')

test('config', async t => {
  const { execa } = createEnv()
  let { stdout } = await execa('config vaultUrl')
  t.equal(stdout, 'undefined')

  await execa('config vaultUrl http://example.com')
  ;({ stdout } = await execa('config vaultUrl'))
  t.equal(stdout, 'http://example.com')

  let stderr
  try {
    await execa('config beep boop')
  } catch (err) {
    stderr = err.stderr
  }
  t.match(stderr, /Available settings/)
})
