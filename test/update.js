'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { encode } = require('dat-encoding')
const { createEnv, onExit } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('with modules', async t => {
  const { spawn, exec, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const [
    {
      rawJSON: { url: contentKey }
    },
    {
      rawJSON: { url: profileKey }
    }
  ] = await Promise.all([
    p2p.init({ type: 'content', title: 't', description: 'd' }),
    p2p.init({ type: 'profile', title: 'n', description: 'd' })
  ])
  await p2p.destroy()

  await t.test('prompt', async t => {
    const ps = await spawn('update')
    await match(ps.stdout, 'Select module')
    ps.kill()
  })

  await t.test('update <hash>', async t => {
    await t.test('content', async t => {
      const ps = await spawn(`update ${encode(contentKey)}`)
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      await match(ps.stdout, 'subtype')
      ps.stdin.write('\n')
      const code = await onExit(ps)
      t.equal(code, 0)

      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.deepEqual(meta, {
        title: 't',
        description: 'beep',
        url: `dat://${encode(contentKey)}`,
        links: {
          license: [
            {
              href:
                'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
            }
          ],
          spec: [{ href: 'https://p2pcommons.com/specs/module/0.2.0' }]
        },
        p2pcommons: {
          type: 'content',
          subtype: 'Q17737',
          main: '',
          authors: [],
          parents: []
        }
      })
    })

    await t.test('profile', async t => {
      const ps = await spawn(`update ${encode(profileKey)}`)
      await match(ps.stdout, 'Name')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      const code = await onExit(ps)
      t.equal(code, 0)

      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(profileKey)}/dat.json`, 'utf8')
      )
      t.deepEqual(meta, {
        title: 'n',
        description: 'beep',
        url: `dat://${encode(profileKey)}`,
        links: {
          license: [
            {
              href:
                'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
            }
          ],
          spec: [{ href: 'https://p2pcommons.com/specs/module/0.2.0' }]
        },
        p2pcommons: {
          type: 'profile',
          subtype: '',
          main: '',
          follows: [],
          contents: []
        }
      })
    })
  })

  await t.test('prompt main', async t => {
    await fs.writeFile(`${env}/${encode(contentKey)}/file.txt`, 'hi')

    const ps = await spawn(`update ${encode(contentKey)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'file.txt')
    ps.stdin.write('\n')
    await match(ps.stdout, 'subtype')
    ps.stdin.write('\n')
    const code = await onExit(ps)
    t.equal(code, 0)

    const meta = JSON.parse(
      await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
    )
    t.deepEqual(meta, {
      title: 't',
      description: 'beep',
      url: `dat://${encode(contentKey)}`,
      links: {
        license: [
          {
            href: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode'
          }
        ],
        spec: [{ href: 'https://p2pcommons.com/specs/module/0.2.0' }]
      },
      p2pcommons: {
        type: 'content',
        subtype: 'Q17737',
        main: 'file.txt',
        authors: [],
        parents: []
      }
    })
  })

  await t.test('update <hash> <key> <value>', async t => {
    await t.test('updates main', async t => {
      await exec(`update ${encode(contentKey)} main main`)
      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.p2pcommons.main, 'main')
    })

    await t.test('updates title', async t => {
      await exec(`update ${encode(contentKey)} title beep`)
      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.title, 'beep')
    })

    await t.test('invalid key', async t => {
      let threw = false
      try {
        await exec(`update ${encode(contentKey)} beep boop`)
      } catch (err) {
        t.ok(err.stderr.includes('Invalid key'))
        threw = true
      }
      t.ok(threw)
    })

    await t.test('clear value', async t => {
      await exec(`update ${encode(contentKey)} main`)

      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.p2pcommons.main, '')
    })

    await t.test('requires title', async t => {
      let threw = false
      try {
        await exec(`update ${encode(contentKey)} title`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid title/)
      }
      t.ok(threw)
    })

    await t.test('requires name', async t => {
      let threw = false
      try {
        await exec(`update ${encode(profileKey)} name`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid name/)
      }
      t.ok(threw)
    })

    await t.test('no name update for content', async t => {
      let threw = false
      try {
        await exec(`update ${encode(contentKey)} name beep`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: name/)
      }
      t.ok(threw)
    })

    await t.test('no title update for profile', async t => {
      let threw = false
      try {
        await exec(`update ${encode(profileKey)} title beep`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: title/)
      }
      t.ok(threw)
    })

    await t.test('no adding new key to content', async t => {
      let threw = false
      try {
        await exec(`update ${encode(contentKey)} foo bar`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: foo/)
      }
      t.ok(threw)
    })

    await t.test('no adding new key to profile', async t => {
      let threw = false
      try {
        await exec(`update ${encode(profileKey)} foo bar`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: foo/)
      }
      t.ok(threw)
    })
  })
})

test('no modules', async t => {
  const { exec } = createEnv()
  let threw = false
  try {
    await exec('update')
  } catch (err) {
    threw = true
    t.match(err.message, /No writable modules/)
  }
  t.ok(threw)
})
