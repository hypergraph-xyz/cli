'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { encode } = require('dat-encoding')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')
const { promises: fs } = require('fs')

const createProfileContent = async ({ env }) => {
  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  const {
    rawJSON: { url: profileKey }
  } = await p2p.init({ type: 'profile', title: 'n' })
  const [
    {
      rawJSON: { url: contentKey },
      metadata: { version: contentVersion }
    }
  ] = await Promise.all([
    p2p.init({ type: 'content', title: 't', main: 'm', authors: [profileKey] }),
    p2p.init({ type: 'content', title: 'no main', authors: [profileKey] }),
    p2p.init({
      type: 'content',
      title: 'non existing main',
      main: 'oh',
      authors: [profileKey]
    })
  ])
  await p2p.destroy()
  await fs.writeFile(`${env}/${contentKey.slice('dat://'.length)}/m`, '')

  return { profileKey, contentKey, contentVersion }
}

test('with modules', async t => {
  await t.test('prompt', async t => {
    const { execa, env } = createEnv()
    await createProfileContent({ env })

    const ps = execa('publish')
    await match(ps.stdout, 'Select profile module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'Select content module')
    ps.stdin.write('\n')
    await match(ps.stdout, 'published to')
    await ps
  })

  await t.test('publish <profile> <content>', async t => {
    const { execa, env } = createEnv()
    const {
      profileKey,
      contentKey,
      contentVersion
    } = await createProfileContent({ env })

    await execa(
      `publish ${encode(profileKey)} dat://${encode(
        contentKey
      )}+${contentVersion}`
    )
  })
})

test('no profile modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('publish')
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
  await p2p.init({ type: 'profile', title: 't' })
  await p2p.destroy()
  let threw = false
  try {
    await execa('publish')
  } catch (err) {
    threw = true
    t.match(err.message, /No content modules/)
  }
  t.ok(threw)
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('publish --help')
})
