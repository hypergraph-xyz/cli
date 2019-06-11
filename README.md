# Liberate Science CLI

[![NPM](https://nodei.co/npm/libscie-cli.png)](https://npmjs.org/package/libscie-cli)

Command Line Interface (CLI) for a Public Collaborative Project (PCP)
infrastructure.

This environment was developed initially for use in scholarly
communication but can be applied outside as well. Anything that can
benefit from a step-by-step approach with provenance pretty much
(@chartgerink also hopes to use it for music :musical_keyboard:).

## Installation

```bash
npm install -g libscie-cli
```

If you do not have [NodeJS](https://nodejs.org/en/) installed, please
install this first. If you are running Windows/Mac OS X it is easiest
to download the installer. If you are using a package manager, you can
install `node`.

## Usage

This tool *directly* allows you to start using public collaborative
infrastructure.

After installation, the `libscie` command is exported to your command
line. 

We follow a simple format for the commands. However, we realize this
isn't easy to remember at first so you can also invoke interactive
mode by simply giving `libscie`. You will be guided through all the
options one-by-one. :angel-tone4:

All commands are structured as

```bash
libscie <action> <input> <arguments>
```

You will always be provided with an interactive set of options if you
omit an action, input, or argument(s) (if relevant). 

Help is provided under `libscie --help` and the maintainers will do
their best to answer your questions in the issues.

## Contributing

Please note we adhere to a [Code of Conduct](./CODE_OF_CONDUCT.md) and
any contributions not in line with it (*tl;dr* be an empathetic,
considerate person) will not be accepted. Please notify
[@chartgerink](mailto:chris@libscie.org) if anything happens.

If you want to develop your own applications using this public
collaborative infrastructure, we recommend you look at our
[Application Programmatic Interface
(API)](https://github.com/libscie/api). All data is portable between
applications if it adheres to the specifications outlined in that
repository.

