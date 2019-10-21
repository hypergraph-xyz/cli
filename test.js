'use strict'

require('fs.promises')

const { test } = require('tap')
const { spawn, exec } = require('child_process')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { homedir, tmpdir } = require('os')
const { decode } = require('dat-encoding')
const { promisify } = require('util')

const hypergraphSpawn = args =>
  spawn('node', [`${__dirname}/bin/hypergraph.js`, ...args.split(' ')])

const hypergraphExec = args =>
  promisify(exec)(`node ${__dirname}/bin/hypergraph.js ${args}`)

const onExit = ps => new Promise(resolve => ps.on('exit', resolve))

test('--help', async t => {
  const ps = hypergraphSpawn('--help')
  await match(ps.stdout, 'interactive mode')
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('default', async t => {
  const ps = hypergraphSpawn('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const ps = hypergraphSpawn('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('create', async t => {
  await t.test('create', async t => {
    const ps = hypergraphSpawn('create')
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
    const ps = hypergraphSpawn('create content')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('create <type> --title --description', async t => {
    const { stdout } = await hypergraphExec(
      'create content --title=t --description=d'
    )
    t.ok(decode(stdout.trim()))
  })

  await t.test('--env', async t => {
    await hypergraphExec('create content -t=t -d=d')
    await fs.stat(`${homedir()}/.p2pcommons`)

    await hypergraphExec(`create content -t=t -d=d --env=${tmpdir()}/.test`)
    await fs.stat(`${tmpdir()}/.test`)
  })
})

test('read', async t => {
  await t.test('read <hash>', async t => {
    let { stdout } = await hypergraphExec(
      'create content --title=t --description=d'
    )
    const hash = stdout.trim()

    ;({ stdout } = await hypergraphExec(`read ${hash}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'd',
      url: `dat://${hash}`,
      type: 'content',
      subtype: 'content',
      main: '',
      license: '',
      authors: [],
      parents: []
    })
  })

  await t.test('read <hash> <key>', async t => {
    let { stdout } = await hypergraphExec(
      'create content --title=t --description=d'
    )
    const hash = stdout.trim()

    ;({ stdout } = await hypergraphExec(`read ${hash} title`))
    t.equal(stdout.trim(), '"t"')
  })
})
