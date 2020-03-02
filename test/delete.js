'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')
const match = require('stream-match')

const createModule = async env => {
  const p2p = new P2PCommons({ baseDir: env, disableSwarm: true })
  await p2p.init({ type: 'content', title: 't' })
  await p2p.destroy()
}

test('prompt', async t => {
  const { execa, env } = createEnv()
  await createModule(env)
  const ps = execa('delete')
  await match(ps.stdout, 'Select module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'y/N')
  ps.stdin.write('y')
  await match(ps.stdout, 'deleted')
  await ps
})

test('no confirm', async t => {
  const { execa, env } = createEnv()
  await createModule(env)
  const ps = execa('delete')
  await match(ps.stdout, 'Select module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'y/N')
  ps.stdin.write('N')
  await match(ps.stderr, 'not confirmed')
  let nonZero = false
  try {
    await ps
  } catch (_) {
    nonZero = true
  }
  t.assert(nonZero)
})

test('--yes', async t => {
  const { execa, env } = createEnv()
  await createModule(env)
  const ps = execa('delete --yes')
  await match(ps.stdout, 'Select module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'deleted')
  await ps
})

test('no modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('delete')
  } catch (err) {
    threw = true
    t.match(err.message, /No writable content modules/)
  }
  t.ok(threw)
})

test('help', async t => {
  const { execa } = createEnv()
  await execa('delete --help')
})
