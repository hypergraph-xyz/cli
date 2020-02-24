'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('with modules', async t => {
  const { execa, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const {
    rawJSON: { url: contentKey }
  } = await p2p.init({ type: 'content', title: 't' })
  const {
    rawJSON: { url: profileKey }
  } = await p2p.init({ type: 'profile', title: 'n', contents: [contentKey] })
  await p2p.destroy()

  await t.test('prompt', async t => {
    const ps = execa('read')
    await match(ps.stdout, 'Select module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'dat://')
    await ps
  })

  await t.test('read <hash>', async t => {
    await t.test('profile', async t => {
      await execa(`read ${encode(profileKey)}`)
    })
    await t.test('content', async t => {
      await execa(`read ${encode(contentKey)}`)
    })
  })
})

test('no modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('read')
  } catch (err) {
    threw = true
    t.match(err.message, /No modules/)
  }
  t.ok(threw)
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('read --help')
})
