'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')
const match = require('stream-match')
const P2P = require('@p2pcommons/sdk-js')

test('no profile', async t => {
  const { execa } = createEnv()
  const followUrl =
    'dat://45f08bbd1bcfe49c78d4409958a301f54595398cd7e3f4f8ede466c55556c3f9'
  const ps = execa(`follow ${followUrl}`)
  await match(ps.stdout, 'create your profile')
  ps.kill()
})

const createProfiles = async ({ envA, envB }) => {
  const p2pA = new P2P({ baseDir: envA })
  const p2pB = new P2P({ baseDir: envB })

  const [
    {
      rawJSON: { url: writableUrl }
    },
    {
      rawJSON: { url: followedUrl },
      metadata: { version: followedVersion }
    }
  ] = await Promise.all([
    p2pA.init({ type: 'profile', title: 'A' }),
    p2pB.init({ type: 'profile', title: 'B' })
  ])
  await p2pA.clone(followedUrl, followedVersion, false)
  await Promise.all([p2pA.destroy(), p2pB.destroy()])

  return { writableUrl, followedUrl }
}

test('prompt', async t => {
  const { env: envA, execa } = createEnv()
  const { env: envB } = createEnv()

  const { writableUrl, followedUrl } = await createProfiles({ envA, envB })

  const ps = execa('follow')
  await match(ps.stdout, 'Url')
  ps.stdin.write(`${followedUrl}\n`)
  await ps

  const p2p = new P2P({ baseDir: envA, disableSwarm: true })
  const mod = await p2p.get(writableUrl)
  t.deepEqual(mod.rawJSON.follows, [followedUrl])
  await p2p.destroy()
})

test('arguments', async t => {
  const { env: envA, execa } = createEnv()
  const { env: envB } = createEnv()

  const { writableUrl, followedUrl } = await createProfiles({ envA, envB })

  await execa(`follow ${followedUrl}`)

  const p2p = new P2P({ baseDir: envA, disableSwarm: true })
  const mod = await p2p.get(writableUrl)
  t.deepEqual(mod.rawJSON.follows, [followedUrl])
  await p2p.destroy()
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('follow --help')
})
