#!/usr/bin/env node
'use strict';
const meow = require('meow');
const libscie = require('libscie-api')

const cli = meow(`
	Usage
	  $ libscie <action> <input>

	Options
	  --env, -e  Custom environment (defaults to ~/.libscie/)

	Examples
	  $ libscie init profile
      $ libscie register
`, {
	flags: {
		rainbow: {
			type: 'string',
			alias: 'e'
		}
	}
})

if ( cli.input[0] === 'init' ) {
    libscie.init(cli.input[1], cli.flags.env)
    // prompt for title
    // prompt for description
    // add to index
}

if ( cli.input[0] === 'register' ) {
    // provide list of isOwner & type === 'module'
    // interactive search + selection
    // provide list of isOwner & type === 'profile'
    // interactive search + selection
}

console.log(cli.flags.env);
