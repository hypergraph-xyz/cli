'use strict'

require('fs.promises')

const { test } = require('tap')
const { spawn } = require('child_process')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { homedir } = require('os')

const hypergraph = args =>
  spawn('node', [`${__dirname}/bin/hypergraph.js`, ...args.split(' ')])

const onExit = ps => new Promise(resolve => ps.on('exit', resolve))

test('--help', async t => {
  const ps = hypergraph('--help')
  await match(ps.stdout, 'interactive mode')
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('default', async t => {
  const ps = hypergraph('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const ps = hypergraph('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('create', async t => {
  await t.test('prompt type, title, description', async t => {
    const ps = hypergraph('create')
    await match(ps.stdout, 'Profile')
    ps.stdin.write('\n')
    await match(ps.stdout, 'Title')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('prompt title, description', async t => {
    const ps = hypergraph('create content')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })
})

test('read')
