'use strict'

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

  allowedKeyUpdates (type) {
    const keys = ['title', 'description', 'main']
    if (type === 'content') keys.push('subtype')
    return keys
  }

  _equal (a, b) {
    if (typeof a === 'string' && typeof b === 'string') {
      return a === b
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    return false
  }

  // Already covered by WithTitleRename
  // async set (metadata) {
  //   const current = await super.get(metadata.url)
  //   const allowedKeys = this.allowedKeyUpdates(current.type)
  //   for (const key of Object.keys(metadata)) {
  //     if (!this._equal(metadata[key], current[key])) {
  //       if (!allowedKeys.includes(key)) {
  //         throw new this.InvalidKeyError(
  //           `Only allowed to update keys ${allowedKeys.join(', ')}`
  //         )
  //       } else if (validate[key]) {
  //         const result = validate[key](metadata[key])
  //         if (typeof result === 'string') {
  //           throw new this.ValidationError(result)
  //         }
  //       }
  //     }
  //   }
  //   return super.set(metadata)
  // }
}

// Use `name` instead of `title` when `type` is `'profile'`
class WithTitleRename extends WithValidations {
  allowedKeyUpdatesWithTitleRename (type) {
    return this.allowedKeyUpdates(type).map(key =>
      key === 'title' && type === 'profile' ? 'name' : key
    )
  }

  _exportWithTitleRename (metadata) {
    metadata = { ...metadata }
    if (metadata.type === 'profile') {
      metadata.name = metadata.title
      delete metadata.title
    }
    return metadata
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
    const current = await super.get(metadata.url)
    const allowedKeys = this.allowedKeyUpdatesWithTitleRename(metadata.type)

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

    metadata = this._importWithTitleRename(metadata)
    return super.set(metadata)
  }

  async init (data) {
    data = this._importWithTitleRename(data)
    const metadata = await super.init(data)
    return this._exportWithTitleRename(metadata)
  }
}

class P2P extends WithTitleRename {}

module.exports = P2P
