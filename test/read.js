'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('with modules', async t => {
  const { spawn, exec, env } = createEnv()

  const p2p = new P2PCommons({ baseDir: env })
  await p2p.ready()
  const [{ url: key }] = await Promise.all([
    p2p.init({ type: 'content', title: 't', description: 'd' }),
    p2p.init({ type: 'profile', title: 'n', description: 'd' })
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
    const { stdout } = await exec(`read ${encode(key)}`)
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: '',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('read <hash> <key>', async t => {
    const { stdout } = await exec(`read ${encode(key)} title`)
    t.equal(stdout.trim(), '"t"')
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
