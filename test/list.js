'use strict'

const { test } = require('tap')
const { createEnv } = require('./util')

test('list content', async t => {
  const { exec } = createEnv()

  const contentTitle = String(Math.random())
  const profileName = String(Math.random())

  await exec(`create content -t=${contentTitle} -d=d -s=Q17737 -y`)
  await exec(`create profile -n=${profileName} -d=d -y`)

  const { stdout } = await exec('list content')
  t.ok(stdout.includes(contentTitle))
  t.notOk(stdout.includes(profileName))
})

test('list profile', async t => {
  const { exec } = createEnv()

  const contentTitle = String(Math.random())
  const profileName = String(Math.random())

  await exec(`create content -t=${contentTitle} -d=d -s=Q17737 -y`)
  await exec(`create profile -n=${profileName} -d=d -y`)

  const { stdout } = await exec('list profile')
  t.notOk(stdout.includes(contentTitle))
  t.ok(stdout.includes(profileName))
})
