'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { encode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('prompt', async t => {
  const { spawn, env } = createEnv()

  const p2p = new P2PCommons({ baseDir: env })
  await p2p.ready()
  await Promise.all([
    p2p.init({ type: 'content', title: 't', description: 'd' }),
    p2p.init({ type: 'profile', title: 'n', description: 'd' })
  ])
  await p2p.destroy()

  const ps = await spawn('update')
  await match(ps.stdout, 'Select module')
  ps.kill()
})

test('no modules', async t => {
  const { exec } = createEnv()
  let threw = false
  try {
    await exec('update')
  } catch (err) {
    threw = true
    t.match(err.message, /No writable modules/)
  }
  t.ok(threw)
})

test('update <hash>', async t => {
  await t.test('content', async t => {
    const { spawn, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    const ps = await spawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'subtype')
    ps.stdin.write('\n')
    const code = await onExit(ps)
    t.equal(code, 0)

    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 't',
      description: 'beep',
      url: encode(key),
      type: 'content',
      subtype: 'Q17737',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('profile', async t => {
    const { spawn, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'profile',
      title: 'n',
      description: 'd'
    })
    await p2p.destroy()

    const ps = await spawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Name')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    const code = await onExit(ps)
    t.equal(code, 0)

    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 'n',
      description: 'beep',
      url: encode(key),
      type: 'profile',
      subtype: '',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      follows: [],
      contents: []
    })
  })
})

test('prompt main', async t => {
  const { spawn, env } = createEnv()

  const p2p = new P2PCommons({ baseDir: env })
  await p2p.ready()
  const { url: key } = await p2p.init({
    type: 'content',
    title: 't',
    description: 'd'
  })
  await p2p.destroy()

  await fs.writeFile(`${env}/${encode(key)}/file.txt`, 'hi')

  const ps = await spawn(`update ${encode(key)}`)
  await match(ps.stdout, 'Title')
  ps.stdin.write('\n') // keep value
  await match(ps.stdout, 'Description')
  ps.stdin.write('beep\n')
  await match(ps.stdout, 'file.txt')
  ps.stdin.write('\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  const code = await onExit(ps)
  t.equal(code, 0)

  const meta = JSON.parse(
    await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
  )
  t.deepEqual(meta, {
    title: 't',
    description: 'beep',
    url: encode(key),
    type: 'content',
    subtype: 'Q17737',
    main: 'file.txt',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
    authors: [],
    parents: []
  })
})

test('update <hash> <key> <value>', async t => {
  await t.test('updates main', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    await exec(`update ${encode(key)} main main`)
    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: encode(key),
      type: 'content',
      subtype: '',
      main: 'main',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('updates title', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    await exec(`update ${encode(key)} title beep`)
    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 'beep',
      description: 'd',
      url: encode(key),
      type: 'content',
      subtype: '',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('invalid key', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} beep boop`)
    } catch (err) {
      t.ok(err.stderr.includes('Invalid key'))
      threw = true
    }
    t.ok(threw)
  })

  await t.test('clear value', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    await exec(`update ${encode(key)} main`)

    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(key)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: encode(key),
      type: 'content',
      subtype: '',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('requires title', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} title`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid title/)
    }
    t.ok(threw)
  })

  await t.test('requires name', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'profile',
      title: 'n',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} name`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid name/)
    }
    t.ok(threw)
  })

  await t.test('no name update for content', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} name beep`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid key: name/)
    }
    t.ok(threw)
  })

  await t.test('no title update for profile', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'profile',
      title: 'n',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} title beep`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid key: title/)
    }
    t.ok(threw)
  })

  await t.test('no adding new key to content', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'content',
      title: 't',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} foo bar`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid key: foo/)
    }
    t.ok(threw)
  })

  await t.test('no adding new key to profile', async t => {
    const { exec, env } = createEnv()

    const p2p = new P2PCommons({ baseDir: env })
    await p2p.ready()
    const { url: key } = await p2p.init({
      type: 'profile',
      title: 'n',
      description: 'd'
    })
    await p2p.destroy()

    let threw = false
    try {
      await exec(`update ${encode(key)} foo bar`)
    } catch (err) {
      threw = true
      t.match(err.message, /Invalid key: foo/)
    }
    t.ok(threw)
  })
})
