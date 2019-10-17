'use strict'

const { test } = require('tap')
const { spawn } = require('child_process')
const { promisify } = require('util')
const match = require('stream-match')

const hypergraph = args =>
  spawn('node', [`${__dirname}/bin/hypergraph.js`, ...args.split(' ')])

test('default', async t => {
  const ps = hypergraph('')
  await match(ps.stdout, 'Initialize')
  ps.kill()
})

test('init', async t => {
  await t.test('prompt type, title, description', async t => {
    const ps = hypergraph('init')
    await match(ps.stdout, 'Profile')
    ps.stdin.write('\n')
    await match(ps.stdout, 'Title')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    await promisify(ps.once.bind(ps))('exit')
  })

  await t.test('prompt title, description', async t => {
    const ps = hypergraph('init content')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    await promisify(ps.once.bind(ps))('exit')
  })
})
