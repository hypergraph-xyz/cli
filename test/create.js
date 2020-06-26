'use strict'

require('../lib/fs-promises')
const { test, beforeEach, afterEach } = require('tap')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { createEnv, createLocalDHT } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

beforeEach(async (done, t) => {
  const { bootstrap, dht } = await createLocalDHT()
  t.context.bootstrap = bootstrap
  t.context.dht = dht
  done()
})

afterEach(async (done, t) => {
  await t.context.dht.destroy()
  done()
})

test('prompt', async t => {
  const { execa } = createEnv({ bootstrap: t.context.bootstrap })
  await execa('create profile -y -n=n -d')
  const ps = execa('create')
  await match(ps.stdout, 'Profile')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Title')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  await match(ps.stdout, 'License')
  ps.stdin.write('y')
  await ps
})

test('requires title', async t => {
  const { execa } = createEnv()
  await execa('create profile -y -n=n -d')
  const ps = execa('create -y')
  await match(ps.stdout, 'Profile')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Title')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Title required')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.kill()
})

test('requires name', async t => {
  const { execa } = createEnv()
  const ps = execa('create -y')
  await match(ps.stdout, 'Profile')
  ps.stdin.write(Buffer.from('1b5b42', 'hex')) // down arrow
  ps.stdin.write('\n')
  await match(ps.stdout, 'Name')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Name required')
  ps.stdin.write('name\n')
  await match(ps.stdout, 'Description')
  ps.kill()
})

test('requires license confirmation', async t => {
  const { execa } = createEnv()
  await execa('create profile -y -n=n -d')
  const ps = execa('create')
  await match(ps.stdout, 'Profile')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Title')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  await match(ps.stdout, 'License')
  ps.stdin.write('\n')
  let exitCode
  try {
    await ps
  } catch (err) {
    exitCode = err.exitCode
  }
  t.equal(exitCode, 1)
})

test('license confirmation can be skipped', async t => {
  const { execa } = createEnv()
  await execa('create profile -y -n=n -d')
  const ps = execa('create -y')
  await match(ps.stdout, 'Profile')
  ps.stdin.write('\n')
  await match(ps.stdout, 'Title')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  await ps
})

test('create content', async t => {
  const { execa, env, rootDir } = createEnv({ bootstrap: t.context.bootstrap })
  await execa('create profile -y -n=n -d')
  const ps = execa('create content -y')
  await match(ps.stdout, 'Title')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  const url = await match(ps.stdout, /dat:\/\/(.+)/)
  await ps

  const p2p = new P2PCommons({
    baseDir: env,
    root: rootDir,
    disableSwarm: true
  })
  const {
    metadata: { id: contentId }
  } = await p2p.get(url)
  const dat = require(`${p2p.storage}/${contentId}/dat.json`)
  t.equal(dat.p2pcommons.authors.length, 1)
})

test('no content without profile allowed', async t => {
  const { execa } = createEnv()
  const ps = execa('create content -y -t=t -d -s=Q17737')
  await match(ps.stdout, 'create your profile first')
  ps.stdin.write('Julian\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('\n')
  await ps
})

test('create profile', async t => {
  const { execa } = createEnv()
  const ps = execa('create profile -y')
  await match(ps.stdout, 'Name')
  ps.stdin.write('name\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await ps
})

test('only one profile allowed', async t => {
  const { execa } = createEnv()
  await execa('create profile -y -n=n -d')
  let threw = false
  try {
    await execa('create profile -y -n=n -d')
  } catch (err) {
    threw = true
    t.match(err.stderr, /A local profile already exists/)
  }
  t.ok(threw)
})

test('parent content', async t => {
  const { env, rootDir, execa } = createEnv()
  const p2p = new P2PCommons({
    baseDir: env,
    root: rootDir,
    disableSwarm: true,
    bootstrap: t.context.bootstrap
  })
  const [
    {
      rawJSON: { url: contentKey },
      metadata: { id: contentId },
      driveWatch
    },
    {
      rawJSON: { url: profileKey }
    }
  ] = await Promise.all([
    p2p.init({ type: 'content', title: 'Content' }),
    p2p.init({ type: 'profile', title: 'Name' })
  ])

  await fs.writeFile(`${p2p.storage}/${contentId}/m`, '')

  await new Promise(resolve => {
    driveWatch.on('put-end', src => {
      if (src.name.endsWith('m')) {
        return resolve()
      }
    })
  })

  const authors = [profileKey]
  await p2p.set({ url: contentKey, authors })
  await p2p.set({ url: contentKey, main: 'm' })

  await p2p.publish(contentKey, profileKey)

  const {
    metadata: { version: contentVersion }
  } = await p2p.get(contentKey)

  await p2p.destroy(true, false)
  const ps = execa('create content -y -t=t -d -s=Q17737')
  await match(ps.stdout, 'Select parent modules')

  ps.stdin.write(' \n')

  const createdKey = await match(ps.stdout, /dat:\/\/(.+)/)

  await ps
  ps.kill()

  const p2p2 = new P2PCommons({
    baseDir: env,
    root: rootDir,
    disableSwarm: true,
    bootstrap: t.context.bootstrap
  })
  const {
    metadata: { id: createdId }
  } = await p2p2.get(createdKey)
  await p2p2.destroy()

  const dat = require(`${p2p.storage}/${createdId}/dat.json`)

  t.deepEqual(dat.p2pcommons.parents, [`${contentKey}+${contentVersion}`])
})

test('create <type> --title --description --subtype --parent', async t => {
  await t.test('creates files', async t => {
    const { execa, env } = createEnv()
    const p2p = new P2PCommons({
      baseDir: env,
      disableSwarm: true,
      bootstrap: t.context.bootstrap
    })
    const {
      rawJSON: { url },
      metadata: { id: contentId, version }
    } = await p2p.init({ type: 'content', title: 'c' })
    await p2p.destroy()
    await execa('create profile -y -n=n -d')
    await execa(
      `create content -t=t -d=d -s=Q17737 --parent=${url}+${version} -y`
    )
    await fs.stat(`${p2p.storage}/${contentId}`)
    await fs.stat(`${p2p.storage}/${contentId}/dat.json`)
    // await fs.stat(`${p2p.storage}/.dat`)
  })

  await t.test('requires title', async t => {
    const { execa } = createEnv()
    await execa('create profile -y -n=n -d')
    const ps = execa('create content --description=d -s=Q17737 -y')
    await match(ps.stdout, 'Title')
    ps.kill()
  })

  await t.test('requires name', async t => {
    const { execa } = createEnv()
    const ps = execa('create profile --description=d -s=Q17737 -y')
    await match(ps.stdout, 'Name')
    ps.kill()
  })

  await t.test('description can be empty', async t => {
    const { execa } = createEnv()
    await execa('create profile -y -n=n -d ')
    await execa('create content -y -t=t -d -s=Q17737')
    await execa('create content -y -t=t -d="" -s=Q17737')
  })

  await t.test('multiple parents', async t => {
    const { execa, env } = createEnv()
    const p2p = new P2PCommons({
      baseDir: env,
      disableSwarm: true,
      bootstrap: t.context.bootstrap
    })
    const [
      {
        rawJSON: { url: parent1 },
        metadata: { version: parent1Version }
      },
      {
        rawJSON: { url: parent2 },
        metadata: { version: parent2Version }
      }
    ] = await Promise.all([
      p2p.init({ type: 'content', title: 'c' }),
      p2p.init({ type: 'content', title: 'c' }),
      p2p.init({ type: 'profile', title: 'p' })
    ])
    await p2p.destroy()
    await execa(
      `create content -t=t -d=d -s=Q17737 --parent=${parent1}+${parent1Version} --parent=${parent2}+${parent2Version} -y`
    )
  })
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('create --help')
})
