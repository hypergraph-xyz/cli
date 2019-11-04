'use strict'

const P2PCommons = require('@p2pcommons/sdk-js')

const main = async () => {
  const p2p = new P2PCommons()
  await p2p.ready()
  const { url } = await p2p.init({ type: 'content', title: 'title' })
  console.log(url)
  await p2p.destroy()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
