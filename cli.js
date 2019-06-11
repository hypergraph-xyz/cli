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
if ( !cli.flags.env ) cli.flags.env = '~./libscie'

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

        if ( action === 'reg' ) {
            await askReg()
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
            { title: 'Register', value: 'reg' }
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

// need to get the caching straight
// then i can provide a title based selection
async function askReg () {
    // select the module to register
    // select the profile to register to
}
