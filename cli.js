#!/usr/bin/env node
'use strict'

const fs = require('fs')
const libscie = require('libscie-api')
const meow = require('meow');
const prompts = require('prompts')

const cli = meow(`
	Usage
	  $ libscie <action> <input>

	Options
	  --env, -e  Custom environment (defaults to ~/.libscie/)

	Examples
      $ libscie                 [interactive mode]
      $ libscie init profile
      $ libscie cache
      $ libscie register
      $ libscie search
`, {
	flags: {
		env: {
			type: 'string',
			alias: 'e'
		}
	}
})

// env checks
if ( !cli.flags.env ) cli.flags.env = '/home/chjh/.libscie'

// if no args go full interactive
// need to add conditional question forwarding
if ( cli.input.length === 0 ) {
    (async () => {
        const action = await askAction()
        if ( action === 'init' ) {
            const type = await askType()
            const meta = await askMeta()

            libscie.init(type,
                         cli.flags.env,
                         meta.title,
                         meta.description)
        }

        if ( action === 'cache' ) {
            libscie.buildCache(cli.flags.env)
        }
        
        if ( action === 'reg' ) {
            const answer = await askReg(cli.flags.env)
            const module = answer.register
            const profile = answer.registerTo
            // register latest version to profile
        }
    })()
}

// can export all askX to ./lib/ask.js
// not now
async function askAction () {
    const qs = {
        type: 'select',
        name: 'action',
        message: 'Pick an action',
        choices: [
            { title: 'Initialize', value: 'init' },
            { title: 'Register', value: 'reg' },
            { title: 'Cache', value: 'cache' }
        ],
        initial: 0
    };

    let res = await prompts(qs)
    return res.action
}

async function askType () {
    const qs = {
        type: 'select',
        name: 'type',
        message: 'Pick a type',
        choices: [
            { title: 'Module', value: 'module' },
            { title: 'Profile', value: 'profile' }
        ],
        initial: 0
    };

    let res = await prompts(qs)
    return res.type
}

async function askMeta () {
    const qs = [
        {
            type: 'text',
            name: 'title',
            message: 'Title'
        },
        {
            type: 'text',
            name: 'description',
            message: 'Description'
        }];

    let res = await prompts(qs)
    return res
}


async function select (type, env) {
    // TODO check profile for writable
    // WAITING on cache containing isOwner
    let cache = await libscie.readCache(env)

    let choices = cache.filter(mod => mod.type === type).
        map(choice => {
            let obj = {}
            obj.title = choice.title
            obj.value = choice.hash

            return obj
        })

    return choices
}

async function askReg (env) {
    let modopts = await select('module', env)
    let profopts = await select('profile', env)

    console.log(profopts)
    const qs = [
        {
            type: 'select',
            name: 'register',
            message: 'Pick a module to register',
            choices:  modopts
        },
        {
            type: 'select',
            name: 'registerTo',
            message: 'Pick a profile to register to',
            choices:  profopts
        }
    ]

    let res = await prompts(qs)
    return res
}
