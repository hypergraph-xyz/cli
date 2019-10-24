'use strict'

require('./lib/fs-promises')
const { test } = require('tap')
const childProcess = require('child_process')
const match = require('stream-match')
const { promises: fs } = require('fs')
const { tmpdir } = require('os')
const { encode, decode } = require('dat-encoding')
const { promisify } = require('util')
const { version } = require('./package')

const createEnv = () => {
  const path = `${__dirname}/bin/hypergraph.js`
  const env = `${tmpdir()}/${Date.now()}-${Math.random()}`
  const spawn = args =>
    childProcess.spawn(path, [...args.split(' '), `--env=${env}`])
  const exec = args =>
    promisify(childProcess.exec)(`${path} ${args} --env=${env}`)
  return { env, spawn, exec }
}

const onExit = ps => new Promise(resolve => ps.on('exit', resolve))

test('--help', async t => {
  const { spawn } = createEnv()
  const ps = spawn('--help')
  await match(ps.stdout, 'interactive mode')
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('--version', async t => {
  const { exec } = createEnv()
  const { stdout } = await exec('--version')
  t.ok(stdout.includes(version))
})

test('default', async t => {
  const { spawn } = createEnv()
  const ps = spawn('')
  await match(ps.stdout, 'Create')
  ps.kill()
})

test('abort prompt', async t => {
  const { spawn } = createEnv()
  const ps = spawn('')
  await match(ps.stdout, 'Create')
  ps.stdin.write('\x03') // Ctrl+C
  const code = await onExit(ps)
  t.equal(code, 1)
})

test('create', async t => {
  await t.test('create', async t => {
    await t.test('prompt', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create')
      await match(ps.stdout, 'Profile')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title')
      ps.stdin.write('title\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('description\n')
      await match(ps.stdout, 'License')
      ps.stdin.write('y')
      ps.stdin.end()
      const code = await onExit(ps)
      t.equal(code, 0)
    })

    await t.test('requires title', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create -y')
      await match(ps.stdout, 'Profile')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title required')
      ps.stdin.write('title\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('description\n')
      const code = await onExit(ps)
      t.equal(code, 0)
    })

    await t.test('requires name', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create -y')
      await match(ps.stdout, 'Profile')
      ps.stdin.write(Buffer.from('1b5b42', 'hex')) // down arrow
      ps.stdin.write('\n')
      await match(ps.stdout, 'Name')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Name required')
      ps.stdin.write('name\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('description\n')
      const code = await onExit(ps)
      t.equal(code, 0)
    })

    await t.test('requires license confirmation', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create')
      await match(ps.stdout, 'Profile')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title')
      ps.stdin.write('title\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('description\n')
      await match(ps.stdout, 'License')
      ps.stdin.write('\n')
      const code = await onExit(ps)
      t.equal(code, 1)
    })

    await t.test('license confirmation ca be skipped', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create -y')
      await match(ps.stdout, 'Profile')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title')
      ps.stdin.write('title\n')
      await match(ps.stdout, 'Description')
      ps.stdin.write('description\n')
      const code = await onExit(ps)
      t.equal(code, 0)
    })
  })

  await t.test('create content', async t => {
    const { spawn } = createEnv()
    const ps = spawn('create content -y')
    await match(ps.stdout, 'Title')
    ps.stdin.write('title\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('create profile', async t => {
    const { spawn } = createEnv()
    const ps = spawn('create profile -y')
    await match(ps.stdout, 'Name')
    ps.stdin.write('name\n')
    await match(ps.stdout, 'Description')
    ps.stdin.write('description\n')
    const code = await onExit(ps)
    t.equal(code, 0)
  })

  await t.test('create <type> --title --description', async t => {
    await t.test('creates files', async t => {
      const { exec, env } = createEnv()
      const { stdout } = await exec('create content --t=t --d=d -y')
      const hash = encode(stdout.trim())
      await fs.stat(`${env}/${hash}`)
      await fs.stat(`${env}/${hash}/dat.json`)
      await fs.stat(`${env}/${hash}/.dat`)
    })

    await t.test('requires title', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create content --description=d -y')
      await match(ps.stdout, 'Title')
      ps.kill()
    })

    await t.test('requires name', async t => {
      const { spawn } = createEnv()
      const ps = spawn('create profile --description=d -y')
      await match(ps.stdout, 'Name')
      ps.kill()
    })
  })
})

test('read', async t => {
  await t.test('read', async t => {
    await t.test('prompt', async t => {
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

    await t.test('no modules', async t => {
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
  })

  await t.test('read <hash>', async t => {
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

  await t.test('read <hash> <key>', async t => {
    const { exec } = createEnv()

    let { stdout } = await exec('create content --t=t --d=d -y')
    const hash = stdout.trim()

    ;({ stdout } = await exec(`read ${hash} title`))
    t.equal(stdout.trim(), '"t"')
  })
})

test('update', async t => {
  await t.test('update', async t => {
    await t.test('prompt', async t => {
      const { exec, spawn } = createEnv()

      await exec('create content --title=t --description=d -y')
      await exec('create profile --name=n --description=d -y')

      const ps = await spawn('update')
      await match(ps.stdout, 'Select module')
      ps.stdin.write('\n')
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      const code = await onExit(ps)
      t.equal(code, 0)
    })

    await t.test('no modules', async t => {
      const { exec } = createEnv()
      let threw = false
      try {
        await exec('update')
      } catch (err) {
        threw = true
        t.match(err.message, /No modules/)
      }
      t.ok(threw)
    })
  })

  await t.test('update <hash>', async t => {
    await t.test('content', async t => {
      const { exec, spawn } = createEnv()

      let { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      const ps = await spawn(`update ${encode(key)}`)
      await match(ps.stdout, 'Title')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      ;({ stdout } = await exec(`read ${encode(key)}`))
      const meta = JSON.parse(stdout)
      t.deepEqual(meta, {
        title: 't',
        description: 'beep',
        url: `dat://${encode(key)}`,
        type: 'content',
        subtype: 'content',
        main: '',
        license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
        authors: [],
        parents: []
      })
    })

    await t.test('profile', async t => {
      const { exec, spawn } = createEnv()

      let { stdout } = await exec('create profile --n=n --d=d -y')
      const key = decode(stdout.trim())

      const ps = await spawn(`update ${encode(key)}`)
      await match(ps.stdout, 'Name')
      ps.stdin.write('\n') // keep value
      await match(ps.stdout, 'Description')
      ps.stdin.write('beep\n')
      ;({ stdout } = await exec(`read ${encode(key)}`))
      const meta = JSON.parse(stdout)
      t.deepEqual(meta, {
        name: 'n',
        description: 'beep',
        url: `dat://${encode(key)}`,
        type: 'profile',
        subtype: 'profile',
        main: '',
        license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
        follows: [],
        contents: []
      })
    })
  })

  await t.test('prompt main', async t => {
    const { exec, spawn, env } = createEnv()

    let { stdout } = await exec('create content --t=t --d=d -y')
    const key = decode(stdout.trim())
    await fs.writeFile(`${env}/${encode(key)}/file.txt`, 'hi')

    const ps = await spawn(`update ${encode(key)}`)
    await match(ps.stdout, 'Title')
    ps.stdin.write('\n') // keep value
    await match(ps.stdout, 'Description')
    ps.stdin.write('beep\n')
    await match(ps.stdout, 'Main')
    await match(ps.stdout, 'file.txt')
    ps.stdin.write('\n')
    ps.stdin.end()
    const code = await onExit(ps)
    t.equal(code, 0)
    ;({ stdout } = await exec(`read ${encode(key)}`))
    const meta = JSON.parse(stdout)
    t.deepEqual(meta, {
      title: 't',
      description: 'beep',
      url: `dat://${encode(key)}`,
      type: 'content',
      subtype: 'content',
      main: 'file.txt',
      license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
      authors: [],
      parents: []
    })
  })

  await t.test('update <hash> <key> <value>', async t => {
    await t.test('updates main', async t => {
      const { exec } = createEnv()

      let { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      await exec(`update ${encode(key)} main main`)
      ;({ stdout } = await exec(`read ${encode(key)}`))
      const meta = JSON.parse(stdout)
      t.deepEqual(meta, {
        title: 't',
        description: 'd',
        url: `dat://${encode(key)}`,
        type: 'content',
        subtype: 'content',
        main: 'main',
        license: 'https://creativecommons.org/publicdomain/zero/1.0/legalcode',
        authors: [],
        parents: []
      })
    })

    await t.test('updates title', async t => {
      const { exec } = createEnv()

      let { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      await exec(`update ${encode(key)} title beep`)
      ;({ stdout } = await exec(`read ${encode(key)}`))
      const meta = JSON.parse(stdout)
      t.deepEqual(meta, {
        title: 'beep',
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

    await t.test('invalid key', async t => {
      const { exec } = createEnv()

      const { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      let threw = false
      try {
        await exec(`update ${encode(key)} beep boop`)
      } catch (err) {
        t.ok(err.stderr.includes('update keys'))
        threw = true
      }
      t.ok(threw)
    })

    await t.test('clear value', async t => {
      const { exec } = createEnv()

      let { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      await exec(`update ${encode(key)} main`)
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

    await t.test('requires title', async t => {
      const { exec } = createEnv()

      const { stdout } = await exec('create content --t=t --d=d -y')
      const key = decode(stdout.trim())

      let threw = false
      try {
        await exec(`update ${encode(key)} title`)
      } catch (err) {
        threw = true
        t.match(err.message, /Title required/)
      }
      t.ok(threw)
    })

    await t.test('requires name', async t => {
      const { exec } = createEnv()

      const { stdout } = await exec('create profile --n=n --d=d -y')
      const key = decode(stdout.trim())

      let threw = false
      try {
        await exec(`update ${encode(key)} name`)
      } catch (err) {
        threw = true
        t.match(err.message, /Name required/)
      }
      t.ok(threw)
    })
  })
})

test('open', async t => {
  const { spawn } = createEnv()
  const ps = spawn('open')
  await match(ps.stdout, 'Hash')
  ps.kill()
})

test('path', async t => {
  // For this action the modules don't need to exist
  const hash =
    '41fac1c7ee0cde5b75ed2de9917a841b3c408dc04e0374a03cb610492f2c486f'

  await t.test('path', async t => {
    const { spawn, env } = createEnv()

    const ps = spawn('path')
    await match(ps.stdout, 'Hash')
    ps.stdin.write(`${hash}\n`)
    await match(ps.stdout, `${env}/${hash}`)
  })

  await t.test('path <hash>', async t => {
    const { exec, env } = createEnv()

    const { stdout } = await exec(`path ${hash}`)
    t.equal(stdout.trim(), `${env}/${hash}`)
  })
})

test('list', async t => {
  await t.test('list content', async t => {
    const { exec } = createEnv()

    const contentTitle = String(Math.random())
    const profileName = String(Math.random())

    await exec(`create content -t=${contentTitle} -d=d -y`)
    await exec(`create profile -n=${profileName} -d=d -y`)

    const { stdout } = await exec('list content')
    t.ok(stdout.includes(contentTitle))
    t.notOk(stdout.includes(profileName))
  })

  await t.test('list profile', async t => {
    const { exec } = createEnv()

    const contentTitle = String(Math.random())
    const profileName = String(Math.random())

    await exec(`create content -t=${contentTitle} -d=d -y`)
    await exec(`create profile -n=${profileName} -d=d -y`)

    const { stdout } = await exec('list profile')
    t.notOk(stdout.includes(contentTitle))
    t.ok(stdout.includes(profileName))
  })
})
