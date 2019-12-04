'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('with modules', async t => {
  const { spawn, exec, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const [
    {
      rawJSON: { url: contentKey }
    },
    {
      rawJSON: { url: profileKey }
    }
  ] = await Promise.all([
    p2p.init({ type: 'content', title: 't' }),
    p2p.init({ type: 'profile', title: 'n' })
  ])
  await p2p.destroy()

  await t.test('prompt', async t => {
    const ps = spawn('read')
    await match(ps.stdout, 'Select module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'dat://')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('read <hash>', async t => {
    await t.test('profile', async t => {
      await exec(`read ${encode(profileKey)}`)
    })
    await t.test('content', async t => {
      await exec(`read ${encode(contentKey)}`)
    })
  })
})

test('no modules', async t => {
  const { exec } = createEnv()
  let threw = false
  try {
    await exec('read')
  } catch (err) {
    threw = true
    t.match(err.message, /No modules/)
  }
  t.ok(threw)
})
