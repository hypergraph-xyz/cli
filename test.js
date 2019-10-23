'use strict'

require('./lib/fs-promises')
const { test } = require('tap')
const { spawn, exec } = require('child_process')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { homedir, tmpdir } = require('os')
const { encode, decode } = require('dat-encoding')
const { promisify } = require('util')
const { version } = require('./package')

const cliSpawn = args =>
  spawn(`${__dirname}/bin/hypergraph.js`, [...args.split(' ')])

const cliExec = args =>
  promisify(exec)(`${__dirname}/bin/hypergraph.js ${args}`)

const onExit = ps => new Promise(resolve => ps.on('exit', resolve))

test('--help', async t => {
  const ps = cliSpawn('--help')
  await match(ps.stdout, 'interactive mode')
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('--version', async t => {
  const { stdout } = await cliExec('--version')
  t.ok(stdout.includes(version))
})

test('default', async t => {
  const ps = cliSpawn('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const ps = cliSpawn('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('create', async t => {
  await t.test('create', async t => {
    const ps = cliSpawn('create')
    await match(ps.stdout, 'Profile')
    ps.stdin.write('\n')
    await match(ps.stdout, 'Title')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('create <type>', async t => {
    const ps = cliSpawn('create content')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('create <type> --title --description', async t => {
    const { stdout } = await cliExec('create content --title=t --description=d')
    const hash = encode(stdout.trim())
    await fs.stat(`${homedir()}/.p2pcommons/${hash}`)
    await fs.stat(`${homedir()}/.p2pcommons/${hash}/dat.json`)
    await fs.stat(`${homedir()}/.p2pcommons/${hash}/.dat`)
  })

  await t.test('--env', async t => {
    await cliExec('create content -t=t -d=d')
    await fs.stat(`${homedir()}/.p2pcommons`)

    await cliExec(`create content -t=t -d=d --env=${tmpdir()}/.test`)
    await fs.stat(`${tmpdir()}/.test`)
  })
})

test('read', async t => {
  await t.test('read', async t => {
    const { stdout } = await cliExec('create content --title=t --description=d')
    const key = decode(stdout.trim())

    const ps = cliSpawn('read')
    ps.stdin.write(`${encode(key)}\n`)
    await match(ps.stdout, `dat://${encode(key)}`)
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('read <hash>', async t => {
    let { stdout } = await cliExec('create content --title=t --description=d')
    const key = decode(stdout.trim())

    ;({ stdout } = await cliExec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'content',
      main: '',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('read <hash> <key>', async t => {
    let { stdout } = await cliExec('create content --title=t --description=d')
    const hash = stdout.trim()

    ;({ stdout } = await cliExec(`read ${hash} title`))
    t.equal(stdout.trim(), '"t"')
  })
})

test('update', async t => {
  await t.test('update <hash>', async t => {
    let { stdout } = await cliExec('create content --title=t --description=d')
    const key = decode(stdout.trim())

    const ps = await cliSpawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'Main')
    ps.stdin.write('main\n')
    ;({ stdout } = await cliExec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'beep',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'content',
      main: 'main',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('update <hash> <key> <value>', async t => {
    let { stdout } = await cliExec('create content --title=t --description=d')
    const key = decode(stdout.trim())

    await cliExec(`update ${encode(key)} main main`)
    ;({ stdout } = await cliExec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'content',
      main: 'main',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })

    await t.test('invalid key', async t => {
      const { stdout } = await cliExec('create content --t=t --d=d')
      const key = decode(stdout.trim())

      let threw = false
      try {
        await cliExec(`update ${encode(key)} beep boop`)
      } catch (err) {
        t.ok(err.stderr.includes('update keys'))
        threw = true
      }
      t.ok(threw)
    })
  })
})

test('list', async t => {
  let { stdout } = await cliExec('create content --t=t --d=d')
  const contentKey = decode(stdout.trim())
  ;({ stdout } = await cliExec('create profile --t=t --d=d'))
  const profileKey = decode(stdout.trim())

  ;({ stdout } = await cliExec('list content'))
  t.ok(stdout.includes(`dat://${encode(contentKey)}`))
  t.notOk(stdout.includes(`dat://${encode(profileKey)}`))
})
