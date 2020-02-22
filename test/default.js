'use strict'

const { test } = require('tap')
const match = require('stream-match')
const { version } = require('../package')
const { createEnv } = require('./util')

test('--help', async t => {
  const { execa } = createEnv()
  const ps = execa('--help')
  await match(ps.stdout, 'Interactive mode')
  let exitCode
  try {
    await ps
  } catch (err) {
    exitCode = err.exitCode
  }
  t.equal(exitCode, 1)
})

test('--version', async t => {
  const { execa } = createEnv()
  const { stdout } = await execa('--version')
  t.ok(stdout.includes(version))
})

test('--env', async t => {
  await t.test('default value', async t => {
    const { execa } = createEnv({ env: '' })
    await execa('list content')
  })
  await t.test('custom value', async t => {
    const { execa } = createEnv()
    await execa('list content')
  })
})

test('default', async t => {
  const { execa } = createEnv()
  const ps = execa('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const { execa } = createEnv()
  const ps = execa('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  let exitCode
  try {
    await ps
  } catch (err) {
    exitCode = err.exitCode
  }
  t.equal(exitCode, 1)
})
