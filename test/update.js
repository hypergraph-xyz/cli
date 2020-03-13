'use strict'

require('../lib/fs-promises')
const { test } = require('tap')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { encode, decode } = require('dat-encoding')
const { createEnv } = require('./util')
const P2PCommons = require('@p2pcommons/sdk-js')

test('with modules', async t => {
  const { execa, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  const {
    rawJSON: { url: profileKey }
  } = await p2p.init({ type: 'profile', title: 'n', description: 'd' })
  const [
    {
      rawJSON: { url: contentKey }
    }
  ] = await Promise.all([
    p2p.init({
      type: 'content',
      title: 't',
      description: 'd',
      authors: [profileKey]
    })
  ])
  await p2p.destroy()

  await t.test('prompt', async t => {
    const ps = execa('update')
    await match(ps.stdout, 'Select module')
    ps.kill()
  })

  await t.test('update <hash>', async t => {
    await t.test('content', async t => {
      const ps = execa(`update ${encode(contentKey)}`)
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      await match(ps.stdout, 'subtype')
      ps.stdin.write('\n')
      await ps

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
          authors: [profileKey],
          parents: []
        }
      })
    })

    await t.test('profile', async t => {
      const ps = execa(`update ${encode(profileKey)}`)
      await match(ps.stdout, 'Name')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      await ps

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
          avatar: '',
          follows: [],
          contents: []
        }
      })
    })
  })

  await t.test('prompt main', async t => {
    await fs.writeFile(`${env}/${encode(contentKey)}/file.txt`, 'hi')

    const ps = execa(`update ${encode(contentKey)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'file.txt')
    ps.stdin.write('\n')
    await match(ps.stdout, 'subtype')
    ps.stdin.write('\n')
    await ps

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
        authors: [profileKey],
        parents: []
      }
    })
  })

  await t.test('parents', async t => {
    const parent1Key = contentKey

    const p2p = new P2PCommons({ baseDir: env, disableSwarm: true })
    const {
      metadata: { version: parent1Version }
    } = await p2p.get(parent1Key)
    await p2p.publish(
      `dat://${encode(parent1Key)}+${parent1Version}`,
      encode(profileKey)
    )
    const {
      rawJSON: { url: parent2Key },
      metadata: { version: parent2Version }
    } = await p2p.init({
      type: 'content',
      title: 'z',
      description: '',
      subtype: 'Q17737',
      authors: [profileKey],
      main: 'file.txt'
    })
    await p2p.publish(
      `dat://${encode(parent2Key)}+${parent2Version}`,
      encode(profileKey)
    )
    await p2p.destroy()

    await t.test('prompt', async t => {
      const { stdout } = await execa('create content -t=t -d -s=Q17737 -p -y')
      const childKey = decode(stdout)

      const ps = execa(`update ${encode(childKey)}`)
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('\n')
      await match(ps.stdout, 'subtype')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Parents')
      ps.stdin.write(' \n')
      await ps

      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(childKey)}/dat.json`, 'utf8')
      )
      t.deepEqual(meta, {
        title: 't',
        description: '',
        url: `dat://${encode(childKey)}`,
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
          authors: [`dat://${encode(profileKey)}`],
          parents: [`dat://${encode(parent1Key)}+${parent1Version}`]
        }
      })

      await t.test('arguments', async t => {
        const { stdout } = await execa('create content -t=t -d -s=Q17737 -p -y')
        const childKey = decode(stdout)

        await execa(
          `update ${encode(childKey)} --parent ${encode(
            parent1Key
          )}+${parent1Version}`
        )

        const meta = JSON.parse(
          await fs.readFile(`${env}/${encode(childKey)}/dat.json`, 'utf8')
        )
        t.deepEqual(meta, {
          title: 't',
          description: '',
          url: `dat://${encode(childKey)}`,
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
            authors: [profileKey],
            parents: [`dat://${encode(parent1Key)}+${parent1Version}`]
          }
        })
      })
    })
  })

  await t.test('update <hash> <key> <value>', async t => {
    await t.test('updates main', async t => {
      await fs.writeFile(`${env}/${encode(contentKey)}/main`, '')
      await execa(`update ${encode(contentKey)} --main main`)
      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.p2pcommons.main, 'main')
    })

    await t.test('updates title', async t => {
      await execa(`update ${encode(contentKey)} --title beep`)
      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.title, 'beep')
    })
    await t.test('clear value', async t => {
      await execa(`update ${encode(contentKey)} --main`)

      const meta = JSON.parse(
        await fs.readFile(`${env}/${encode(contentKey)}/dat.json`, 'utf8')
      )
      t.equal(meta.p2pcommons.main, '')
    })

    await t.test('requires title', async t => {
      let threw = false
      try {
        await execa(`update ${encode(contentKey)} --title`)
      } catch (err) {
        threw = true
        t.match(err.message, /required-string/)
      }
      t.ok(threw)
    })

    await t.test('requires name', async t => {
      let threw = false
      try {
        await execa(`update ${encode(profileKey)} --name`)
      } catch (err) {
        threw = true
        t.match(err.message, /name/)
      }
      t.ok(threw)
    })

    await t.test('no name update for content', async t => {
      let threw = false
      try {
        await execa(`update ${encode(contentKey)} --name beep`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: name/)
      }
      t.ok(threw)
    })

    await t.test('no title update for profile', async t => {
      let threw = false
      try {
        await execa(`update ${encode(profileKey)} --title beep`)
      } catch (err) {
        threw = true
        t.match(err.message, /Invalid key: title/)
      }
      t.ok(threw)
    })
  })
})

test('no modules', async t => {
  const { execa } = createEnv()
  let threw = false
  try {
    await execa('update')
  } catch (err) {
    threw = true
    t.match(err.message, /No writable modules/)
  }
  t.ok(threw)
})
