'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('main', async t => {
  await t.test('no modules', async t => {
    const { execa } = createEnv()
    let err

    try {
      await execa('main')
    } catch (_err) {
      err = _err
    }

    t.ok(err)
    t.match(err.stderr, 'No modules with main files')
  })

  await t.test('with modules', async t => {
    const { execa, env } = createEnv()

    const p2p = new P2PCommons({
      baseDir: env,
      disableSwarm: true
    })
    await p2p.ready()
    await p2p.init({
      type: 'content',
      title: 't',
      description: 'd',
      main: 'file'
    })
    await p2p.destroy()

    const ps = execa('main')
    await match(ps.stdout, 'Select module')
    ps.kill()
  })
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('main --help')
})
