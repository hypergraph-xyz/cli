'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')
const { promises: fs } = require('fs')

test('with modules', async t => {
  const { execa, env } = createEnv()

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
    p2p.init({ type: 'content', title: 't', main: 'm' }),
    p2p.init({ type: 'profile', title: 'n' }),
    p2p.init({ type: 'content', title: 'no main' }),
    p2p.init({ type: 'content', title: 'non existing main', main: 'oh' })
  ])
  await p2p.destroy()
  await fs.writeFile(`${env}/${contentKey.slice('dat://'.length)}/m`, '')

  await t.test('prompt', async t => {
    const ps = execa('register')
    await match(ps.stdout, 'Select content module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'Select profile module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'registered to')
    await ps
  })

  await t.test('register <content> <profile>', async t => {
    await execa(`register ${encode(contentKey)} ${encode(profileKey)}`)
  })
})

test('no content modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('register')
  } catch (err) {
    threw = true
    t.match(err.message, /No content modules/)
  }
  t.ok(threw)
})

test('no profile modules', async t => {
  const { execa, env } = createEnv()
  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  await p2p.init({ type: 'content', title: 't' })
  await p2p.destroy()
  let threw = false
  try {
    await execa('register')
  } catch (err) {
    threw = true
    t.match(err.message, /No profile modules/)
  }
  t.ok(threw)
})
