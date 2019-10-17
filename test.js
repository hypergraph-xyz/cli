'use strict'

const { test } = require('tap')
const { spawn } = require('child_process')
const { promisify } = require('util')
const match = require('stream-match')

const hypergraph = args =>
  spawn('node', [`${__dirname}/bin/hypergraph.js`, ...args.split(' ')])

test('init', async t => {
  const ps = hypergraph('init content')
  ps.stdin.write('title\n')
  await match(ps.stdout, 'Description')
  ps.stdin.write('description\n')
  await promisify(ps.once.bind(ps))('exit')
})
