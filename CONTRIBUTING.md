# Contributing to @hypergraph-xyz/cli

Welcome! We *love* that you're interested in contributing to Hypergraph :purple_heart:

We recognize all our contributors using the [all-contributors](https://github.com/all-contributors/all-contributors) bot. Contributions of any kind welcome!

Come and join us on [Slack](https://join.slack.com/t/libscie/shared_invite/zt-9l0ig1x1-Sxjun7D6056cOUQ2Ai_Bkw) to chat with our team and stay up to date with all [Liberate Science](https://libscie.org) goings-on.

## Code of conduct

Please note we adhere to a [Code of Conduct](https://github.com/hypergraph-xyz/cli/blob/master/CODE_OF_CONDUCT.md) and any contributions not in line with it (*tl;dr* be an empathetic, considerate person) will not be accepted. Please notify [@chartgerink](mailto:chris@libscie.org) if anything happens.

## Feature requests & bug reports

Feature requests and bug reports can be submitted through [GitHub issues](https://github.com/hypergraph-xyz/cli/issues).

We offer templates for feature requests and bug reports.

### Security vulnerabilities

Please report security vulnerabilities directly to [@chartgerink](mailto:chris@libscie.org).

## Contributing code

### Where to start?

Our work is organized on [GitHub Issues](https://github.com/hypergraph-xyz/cli/issues). Our [Roadmap (see issues in the CLI column marked with an ❌)](https://github.com/hypergraph-xyz/desktop/wiki/Roadmap) contains issues that we are planning on working on further down the line. If you're enthusiastic about one of these features, come and discuss it with us on [Slack](https://libscie.slack.com/) ([invite link](https://join.slack.com/t/libscie/shared_invite/zt-9l0ig1x1-Sxjun7D6056cOUQ2Ai_Bkw)).

Technical improvements, bug fixes, documentation and other non-feature work is also totally welcome.

### Git guidelines

When starting work on an issue, please comment to say you're working on it. Create a fork for your work and submit a pull request that closes the issue when done. If you'd like input along the way, a draft pull request is also fine. Please invite recent contributors to review (at least one, but preferably two or more). Project maintainers will take care of releases and labels, etc. Feel free to ask questions at any time.

In general the ideal PR process looks like this (just for reference):

#### Step 1: Fork

Fork the project [on GitHub](https://github.com/hypergraph-xyz/cli) and check out your copy locally.

```bash
$ git clone git@github.com:username/cli.git
$ cd cli
$ npm install
$ git remote add upstream git://github.com/hypergraph-xyz/cli.git
```

#### Step 2: Branch

Create a feature branch and start hacking:

```bash
$ git checkout -b my-feature-branch -t origin/master
```

#### Step 3: Test

Bug fixes and features **should come with tests**. 

```bash
$ npm test
```

#### Step 4: Commit

Make sure git knows your name and email address:

```bash
$ git config --global user.name "Bruce Wayne"
$ git config --global user.email "bruce@batman.com"
```

Writing good commit logs is important. A commit log should describe what changed and why.

#### Step 5: Push

```bash
$ git push origin my-feature-branch
```

#### Step 6: Make a pull request ;)

### Documentation

If your work adds functionality or changes the way existing functionality works, please document this in the [README.md](https://github.com/hypergraph-xyz/cli/blob/master/README.md).

### Style guide

We are using `eslint` with the `standard` [config](https://github.com/standard/eslint-config-standard).

**Tip**: If you are using an editor like `vim` you can check out GEUT's [xd](https://github.com/geut/xd) to improve your _dx_. :v:

## Build your own p2pcommons application!

If you want to develop your own applications using this public collaborative infrastructure, we recommend you look at the [p2pcommons Software Development Kit (SDK)](https://github.com/p2pcommons/sdk-js). All data is portable between applications if it adheres to the specifications outlined in the [@p2pcommons/specs](https://github.com/p2pcommons/specs) repository.
