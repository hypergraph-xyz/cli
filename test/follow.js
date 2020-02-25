'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')
const match = require('stream-match')
const P2P = require('@p2pcommons/sdk-js')

test('profile url required', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('follow')
  } catch (err) {
    threw = true
    t.match(err.stderr, /url required/)
  }
  t.ok(threw)
})

test('no profile', async t => {
  const { execa } = createEnv()
  const followUrl =
    'dat://45f08bbd1bcfe49c78d4409958a301f54595398cd7e3f4f8ede466c55556c3f9'
  const ps = execa(`follow ${followUrl}`)
  await match(ps.stdout, 'create your profile')
  ps.kill()
})

test('follow', async t => {
  const { execa, env } = createEnv()
  let p2p = new P2P({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  const {
    rawJSON: { url }
  } = await p2p.init({ type: 'profile', title: 'p' })
  await p2p.destroy()

  await execa(`follow ${url}`)

  p2p = new P2P({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  const mod = await p2p.get(url)
  t.deepEqual(mod.rawJSON.follows, [url])
  await p2p.destroy()
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('follow --help')
})
