'use strict'

const { test } = require('tap')
const match = require('stream-match')
const { encode, decode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')

test('prompt', async t => {
  const { exec, spawn } = createEnv()

  await exec('create content --title=t --description=d -y')
  await exec('create profile --name=n --description=d -y')

  const ps = spawn('read')
  await match(ps.stdout, 'Select module')
  ps.stdin.write('\n')
  await match(ps.stdout, 'dat://')
  ps.stdin.end()
  const code = await onExit(ps)
  t.equal(code, 0)
})

test('no modules', async t => {
  const { exec } = createEnv()
  let threw = false
  try {
    await exec('read')
  } catch (err) {
    threw = true
    t.match(err.message, /No modules/)
  }
  t.ok(threw)
})

test('read <hash>', async t => {
  const { exec } = createEnv()

  let { stdout } = await exec('create content --t=t --d=d -y')
  const key = decode(stdout.trim())

  ;({ stdout } = await exec(`read ${encode(key)}`))
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

test('read <hash> <key>', async t => {
  const { exec } = createEnv()

  let { stdout } = await exec('create content --t=t --d=d -y')
  const hash = stdout.trim()

  ;({ stdout } = await exec(`read ${hash} title`))
  t.equal(stdout.trim(), '"t"')
})
