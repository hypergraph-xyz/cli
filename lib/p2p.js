'use strict'

const { encode, decode } = require('dat-encoding')
const P2PCommons = require('@p2pcommons/sdk-js')
const UserError = require('./user-error')
const validate = require('./validate')

// Multiple layers of wrappers around the P2PCommons SDK,
// each implementing a certain feature set.

// Validate keys on set
class WithValidations extends P2PCommons {
  constructor (...args) {
    super(...args)
    this.InvalidKeyError = class InvalidKeyError extends UserError {}
    this.ValidationError = class ValidationError extends UserError {}
  }

  allowedKeyUpdates () {
    return ['title', 'description', 'main']
  }

  _equal (a, b) {
    if (typeof a === 'string' && typeof b === 'string') {
      return a === b
    }
    if (Buffer.isBuffer(a) && Buffer.isBuffer(b)) {
      return Buffer.compare(a, b) === 0
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    return false
  }

  async set (metadata) {
    const current = await super.get(metadata.url)
    const allowedKeys = this.allowedKeyUpdates(current.type)
    for (const key of Object.keys(metadata)) {
      if (!this._equal(metadata[key], current[key])) {
        if (!allowedKeys.includes(key)) {
          throw new this.InvalidKeyError(
            `Only allowed to update keys ${allowedKeys.join(', ')}`
          )
        } else if (validate[key]) {
          const result = validate[key](metadata[key])
          if (typeof result === 'string') {
            throw new this.ValidationError(result)
          }
        }
      }
    }
    return super.set(metadata)
  }
}

// Use `name` instead of `title` when `type` is `'profile'`
class WithTitleRename extends WithValidations {
  allowedKeyUpdatesWithTitleRename (type) {
    return this.allowedKeyUpdates().map(key =>
      key === 'title' && type === 'profile' ? 'name' : key
    )
  }

  _exportWithTitleRename (data) {
    data = { ...data }
    const metadata = data.rawJSON || data
    if (metadata.type === 'profile') {
      metadata.name = metadata.title
      delete metadata.title
    }
    return data
  }

  _importWithTitleRename (metadata) {
    metadata = { ...metadata }
    if (metadata.type === 'profile') {
      metadata.title = metadata.name
      delete metadata.name
    }
    return metadata
  }

  async get (hash, ...args) {
    const metadata = await super.get(hash, ...args)
    return this._exportWithTitleRename(metadata)
  }

  async set (metadata) {
    metadata = this._importWithTitleRename(metadata)
    try {
      return await super.set(metadata)
    } catch (err) {
      if (
        metadata.type === 'profile' &&
        err instanceof this.ValidationError &&
        /Title/.test(err.message)
      ) {
        throw new this.ValidationError('Name required')
      }
      throw err
    }
  }

  async init (data) {
    data = this._importWithTitleRename(data)
    const metadata = await super.init(data)
    return this._exportWithTitleRename(metadata)
  }

  async listContent () {
    const dbItems = await super.listContent()
    for (const [idx, dbItem] of Object.entries(dbItems)) {
      dbItems[idx] = this._exportWithTitleRename(dbItem)
    }
    return dbItems
  }

  async listProfiles () {
    const dbItems = await super.listProfiles()
    for (const [idx, dbItem] of Object.entries(dbItems)) {
      dbItems[idx] = this._exportWithTitleRename(dbItem)
    }
    return dbItems
  }
}

// Use dat:// links instead of hashes
class WithDatLinks extends WithTitleRename {
  _exportWithDatLinks (data) {
    data = { ...data }
    const metadata = data.rawJSON || data
    metadata.url = `dat://${encode(metadata.url)}`
    return data
  }

  _importWithDatLinks (metadata) {
    metadata = { ...metadata }
    metadata.url = decode(metadata.url)
    return metadata
  }

  async init (...data) {
    const metadata = await super.init(...data)
    return this._exportWithDatLinks(metadata)
  }

  async get (hash, ...args) {
    const metadata = await super.get(decode(hash), ...args)
    return this._exportWithDatLinks(metadata)
  }

  async set (metadata) {
    metadata = this._importWithDatLinks(metadata)
    return super.set(metadata)
  }

  async listContent () {
    const dbItems = await super.listContent()
    for (const [idx, dbItem] of Object.entries(dbItems)) {
      dbItems[idx] = this._exportWithDatLinks(dbItem)
    }
    return dbItems
  }

  async listProfiles () {
    const dbItems = await super.listProfiles()
    for (const [idx, dbItem] of Object.entries(dbItems)) {
      dbItems[idx] = this._exportWithDatLinks(dbItem)
    }
    return dbItems
  }
}

class P2P extends WithDatLinks {}

module.exports = P2P
