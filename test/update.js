'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { encode, decode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')

test('prompt', async t => {
  const { exec, spawn } = createEnv()

  await exec('create content --title=t --description=d -s=Q17737 -y')
  await exec('create profile --name=n --description=d -y')

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
    const { exec, spawn } = createEnv()

    let { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

    const ps = await spawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'subtype')
    ps.stdin.write('\n')
    const code = await onExit(ps)
    t.equal(code, 0)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'beep',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'Q17737',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('profile', async t => {
    const { exec, spawn } = createEnv()

    let { stdout } = await exec('create profile -n=n -d=d -y')
    const key = decode(stdout.trim())

    const ps = await spawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Name')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    const code = await onExit(ps)
    t.equal(code, 0)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      name: 'n',
      description: 'beep',
      url: `dat://${encode(key)}`,
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
  const { exec, spawn, env } = createEnv()

  let { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
  const key = decode(stdout.trim())
  await fs.writeFile(`${env}/${encode(key)}/file.txt`, 'hi')

  const ps = await spawn(`update ${encode(key)}`)
  await match(ps.stdout, 'Title')
  ps.stdin.write('\n') // keep value
  await match(ps.stdout, 'Description')
  ps.stdin.write('beep\n')
  await match(ps.stdout, 'Main')
  await match(ps.stdout, 'file.txt')
  ps.stdin.write('\n')
  await match(ps.stdout, 'subtype')
  ps.stdin.write('\n')
  const code = await onExit(ps)
  t.equal(code, 0)
  ;({ stdout } = await exec(`read ${encode(key)}`))
  const meta = JSON.parse(stdout)
  t.deepEqual(meta, {
    title: 't',
    description: 'beep',
    url: `dat://${encode(key)}`,
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
    const { exec } = createEnv()

    let { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

    await exec(`update ${encode(key)} main main`)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'Q17737',
      main: 'main',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('updates title', async t => {
    const { exec } = createEnv()

    let { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

    await exec(`update ${encode(key)} title beep`)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 'beep',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'Q17737',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('invalid key', async t => {
    const { exec } = createEnv()

    const { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    let { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

    await exec(`update ${encode(key)} main`)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'Q17737',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('requires title', async t => {
    const { exec } = createEnv()

    const { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    const { stdout } = await exec('create profile -n=n -d=d -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    const { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    const { stdout } = await exec('create profile -n=n -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    const { stdout } = await exec('create content -t=t -d=d -s=Q17737 -y')
    const key = decode(stdout.trim())

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
    const { exec } = createEnv()

    const { stdout } = await exec('create profile -n=n -d=d -y')
    const key = decode(stdout.trim())

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
