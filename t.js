'use strict'

const { createEnv } = require('./test/util')
const P2PCommons = require('@p2pcommons/sdk-js')
const { promises: fs } = require('fs')

const delay = dt => new Promise(resolve => setTimeout(resolve, dt))

const main = async () => {
  const { exec, env } = createEnv()

  const p2p = new P2PCommons({
    baseDir: env,
    disableSwarm: true
  })
  await p2p.ready()
  const [
    {
      rawJSON: { url: contentKey }
    }, {
      rawJSON: { url: profileKey }
    }
  ] = await Promise.all([
    p2p.init({ type: 'content', title: 't', main: 'm' }),
    p2p.init({ type: 'profile', title: 'n' })
  ])
  await p2p.destroy()
  await fs.writeFile(`${env}/${contentKey.slice('dat://'.length)}/m`, '')

  await delay(1000)
  await exec(`register ${contentKey} ${profileKey}`)

  // const p2p2 = new P2PCommons({
  //   baseDir: env,
  //   disableSwarm: true
  // })
  // await p2p2.ready()
  // await Promise.all([
  //   p2p2.get(contentKey),
  //   p2p2.get(profileKey)
  // ])
  // await p2p2.register(contentKey, profileKey)
  // await p2p2.destroy()
  // console.log('all good')
}

main().catch(err => console.error(err))
