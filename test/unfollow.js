'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')
const match = require('stream-match')
const P2P = require('@p2pcommons/sdk-js')

test('no profile', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('unfollow')
  } catch (err) {
    threw = true
    t.match(err.stderr, 'No local profile')
  }
  t.ok(threw)

  threw = false
  const followUrl =
    'dat://45f08bbd1bcfe49c78d4409958a301f54595398cd7e3f4f8ede466c55556c3f9'
  try {
    await execa(`unfollow ${followUrl}`)
  } catch (err) {
    threw = true
    t.match(err.stderr, 'No local profile')
  }
  t.ok(threw)
})

test('not following anyone', async t => {
  const { execa, env } = createEnv()

  const p2p = new P2P({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  await p2p.init({ type: 'profile', title: 'p' })
  await p2p.destroy()

  const ps = execa('unfollow')
  let threw = false
  try {
    await ps
  } catch (err) {
    t.match(err.stderr, 'Not following anyone')
    threw = true
  }
  t.ok(threw)
})

test('prompt', async t => {
  const { execa, env } = createEnv()

  let p2p = new P2P({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  const {
    rawJSON: { url }
  } = await p2p.init({ type: 'profile', title: 'p' })
  await p2p.follow(url, url)
  await p2p.destroy()

  const ps = execa('unfollow')
  await match(ps.stdout, 'Select profile module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'stopped following')
  await ps

  p2p = new P2P({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  const {
    rawJSON: { follows }
  } = await p2p.get(url)
  t.deepEqual(follows, [])
  await p2p.destroy()
})
