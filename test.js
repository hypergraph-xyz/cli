'use strict'

const { test } = require('tap')
const { spawn } = require('child_process')
const { promisify } = require('util')

const sleep = dt => new Promise(resolve => setTimeout(resolve, dt))

const hypergraph = args =>
  spawn('node', [`${__dirname}/bin/hypergraph.js`, ...args.split(' ')])

test('init', async t => {
  const ps = hypergraph('init content')
  ps.stdin.write('title\n')
  await sleep(500)
  ps.stdin.write('description\n')
  await promisify(ps.once.bind(ps))('exit')
})
