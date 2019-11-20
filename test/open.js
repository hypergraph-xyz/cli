'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('open', async t => {
  const { spawn, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  await p2p.init({ type: 'content', title: 't' })
  await p2p.destroy()

  const ps = spawn('open')
  await match(ps.stdout, 'Select module')
  ps.kill()
})
