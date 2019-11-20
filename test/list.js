'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const { createEnv } = require('./util')
const P2PCommons = require('../lib/p2p')

test('list', async t => {
  const { exec, env } = createEnv()

  const contentTitle = String(Math.random())
  const profileName = String(Math.random())

  const p2p = new P2PCommons({ baseDir: env, disableSwarm: true })
  await p2p.ready()
  await Promise.all([
    p2p.init({ type: 'content', title: contentTitle }),
    p2p.init({ type: 'profile', name: profileName })
  ])
  await p2p.destroy()

  let { stdout } = await exec('list content')
  t.ok(stdout.includes(contentTitle))
  t.notOk(stdout.includes(profileName))
  ;({ stdout } = await exec('list profile'))
  t.notOk(stdout.includes(contentTitle))
  t.ok(stdout.includes(profileName))
})
