'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('main', async t => {
  await t.test('no modules', async t => {
    const { exec } = createEnv()
    let err

    try {
      await exec('main')
    } catch (_err) {
      err = _err
    }

    t.ok(err)
    t.match(err.stderr, 'No modules with main files')
  })

  await t.test('with modules', async t => {
    const { spawn, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    // https://github.com/p2pcommons/sdk-js/issues/36
    const { url } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.set({ url, main: 'file' })
    await p2p.destroy()

    const ps = spawn('main')
    await match(ps.stdout, 'Select module')
    ps.kill()
  })
})
