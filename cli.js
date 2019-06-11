#!/usr/bin/env node
'use strict'

const fs = require('fs')
const meow = require('meow');
const libscie = require('libscie-api')
const prompts = require('prompts')

const cli = meow(`
	Usage
	  $ libscie <action> <input>

	Options
	  --env, -e  Custom environment (defaults to ~/.libscie/)

	Examples
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

if ( !cli.flags.env ) cli.flags.env = '~./libscie'

// if no args show help
if ( cli.input.length == 0 ) console.log(cli.help)

if ( cli.input[0] === 'init' ) {
    (async () => {
        const response = await prompts(
            [
                {
                    type: 'text',
                    name: 'title',
                    message: 'Title or Name:'
                },
                {
                    type: 'text',
                    name: 'description',
                    message: 'Description'
                }
            ]);
        
        libscie.init(cli.input[1],
                     cli.flags.env,
                     response.title,
                     response.description)
    })();
    
}

if ( cli.input[0] === 'register' ) {
    // provide list of isOwner & type === 'module'
    // interactive search + selection
    // provide list of isOwner & type === 'profile'
    // interactive search + selection
}

if ( cli.input[0] === 'search' ) {}
