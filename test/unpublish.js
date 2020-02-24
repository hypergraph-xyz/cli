'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

const createModules = async env => {
  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const {
    rawJSON: { url: contentKey },
    metadata: { version: contentVersion }
  } = await p2p.init({ type: 'content', title: 'c' })
  const {
    rawJSON: { url: profileKey }
  } = await p2p.init({
    type: 'profile',
    title: 'p',
    contents: [`${contentKey}+${contentVersion}`]
  })
  await p2p.destroy()
  return { contentKey, contentVersion, profileKey }
}

const verifyProfile = async (t, { env, profileKey }) => {
  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const {
    rawJSON: { contents }
  } = await p2p.get(profileKey)
  t.equal(contents.length, 0)
  await p2p.destroy()
}

test('prompt', async t => {
  const { execa, env } = createEnv()
  const { profileKey } = await createModules(env)
  const ps = execa('unpublish')
  await match(ps.stdout, 'Select profile module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Select content module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'unpublished')
  await ps
  await verifyProfile(t, { env, profileKey })
})

test('unpublish <profile> <content>', async t => {
  const { execa, env } = createEnv()
  const { profileKey, contentKey, contentVersion } = await createModules(env)
  await execa(`unpublish ${encode(profileKey)} ${contentKey}+${contentVersion}`)
  await verifyProfile(t, { env, profileKey })
})

test('no profile modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('unpublish')
  } catch (err) {
    threw = true
    t.match(err.message, /No profile modules/)
  }
  t.ok(threw)
})

test('no content modules', async t => {
  const { execa, env } = createEnv()
  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const {
    rawJSON: { url: profileKey }
  } = await p2p.init({ type: 'profile', title: 't' })
  await p2p.destroy()
  let threw = false
  try {
    await execa('unpublish')
  } catch (err) {
    threw = true
    t.match(err.message, /No content modules/)
  }
  t.ok(threw)

  threw = false
  try {
    await execa(`unpublish ${profileKey}`)
  } catch (err) {
    threw = true
    t.match(err.message, /No content modules/)
  }
  t.ok(threw)
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('unpublish --help')
})
