'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('list', async t => {
  const { exec, env } = createEnv()

  const contentTitle = String(Math.random())
  const profileName = String(Math.random())

  const p2p = new P2PCommons({ baseDir: env })
  await p2p.ready()
  await Promise.all([
    p2p.init({ type: 'content', title: contentTitle, description: 'd' }),
    p2p.init({ type: 'profile', title: profileName, description: 'd' })
  ])
  await p2p.destroy()

  let { stdout } = await exec('list content')
  t.ok(stdout.includes(contentTitle))
  t.notOk(stdout.includes(profileName))

  ;({ stdout } = await exec('list profile'))
  t.notOk(stdout.includes(contentTitle))
  t.ok(stdout.includes(profileName))
})

