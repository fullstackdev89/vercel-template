// Native
const {join, resolve} = require('path')

// Packages
const test = require('ava')
const {asc: alpha} = require('alpha-sort')
const {readFile} = require('fs-promise')

// Ours
const hash = require('../lib/hash')
const readMetadata = require('../lib/read-metadata')
const {npm: getNpmFiles_, docker: getDockerFiles} = require('../lib/get-files')

const prefix = join(__dirname, '_fixtures') + '/'
const base = path => path.replace(prefix, '')
const fixture = name => resolve(`./test/_fixtures/${name}`)

// overload to force debugging
const getNpmFiles = async dir => {
  const {pkg, nowConfig} = await readMetadata(dir, {quiet: true, strict: false})
  return getNpmFiles_(dir, pkg, nowConfig)
}

test('`files`', async t => {
  let files = await getNpmFiles(fixture('files-in-package'))
  t.is(files.length, 3)
  files = files.sort(alpha)
  t.is(base(files[0]), 'files-in-package/build/a/b/c/d.js')
  t.is(base(files[1]), 'files-in-package/build/a/e.js')
  t.is(base(files[2]), 'files-in-package/package.json')
})

test('`files` + `.*.swp` + `.npmignore`', async t => {
  let files = await getNpmFiles(fixture('files-in-package-ignore'))
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'files-in-package-ignore/build/a/b/c/d.js')
  t.is(base(files[1]), 'files-in-package-ignore/build/a/e.js')
  t.is(base(files[2]), 'files-in-package-ignore/package.json')
})

test('`files` overrides `.gitignore`', async t => {
  let files = await getNpmFiles(fixture('files-overrides-gitignore'))
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'files-overrides-gitignore/package.json')
  t.is(base(files[1]), 'files-overrides-gitignore/test.js')
  t.is(base(files[2]), 'files-overrides-gitignore/test.json')
})

test('`now.files` overrides `.npmignore`', async t => {
  let files = await getNpmFiles(fixture('now-files-overrides-npmignore'))
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'now-files-overrides-npmignore/package.json')
  t.is(base(files[1]), 'now-files-overrides-npmignore/test.js')
  t.is(base(files[2]), 'now-files-overrides-npmignore/test.json')
})

test('simple', async t => {
  let files = await getNpmFiles(fixture('simple'))
  files = files.sort(alpha)
  t.is(files.length, 5)
  t.is(base(files[0]), 'simple/bin/test')
  t.is(base(files[1]), 'simple/index.js')
  t.is(base(files[2]), 'simple/lib/woot')
  t.is(base(files[3]), 'simple/lib/woot.jsx')
  t.is(base(files[4]), 'simple/package.json')
})

test('simple with main', async t => {
  let files = await getNpmFiles(fixture('simple-main'))
  t.is(files.length, 3)
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'simple-main/build/a.js')
  t.is(base(files[1]), 'simple-main/index.js')
  t.is(base(files[2]), 'simple-main/package.json')
})

test('directory main', async t => {
  let files = await getNpmFiles(fixture('directory-main'))
  t.is(files.length, 3)
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'directory-main/a/index.js')
  t.is(base(files[1]), 'directory-main/build/a.js')
  t.is(base(files[2]), 'directory-main/package.json')
})

test('extensionless main', async t => {
  let files = await getNpmFiles(fixture('extensionless-main'))
  t.is(files.length, 3)
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'extensionless-main/build/a.js')
  t.is(base(files[1]), 'extensionless-main/index.js')
  t.is(base(files[2]), 'extensionless-main/package.json')
})

test('hashes', async t => {
  const files = await getNpmFiles(fixture('hashes'))
  const hashes = await hash(files)
  t.is(hashes.size, 3)
  const many = new Set(hashes.get('277c55a2042910b9fe706ad00859e008c1b7d172').names)
  t.is(many.size, 2)
  t.is(many.has(prefix + 'hashes/dei.png'), true)
  t.is(many.has(prefix + 'hashes/duplicate/dei.png'), true)
  t.is(hashes.get('56c00d0466fc6bdd41b13dac5fc920cc30a63b45').names[0], prefix + 'hashes/index.js')
  t.is(hashes.get('706214f42ae940a01d2aa60c5e32408f4d2127dd').names[0], prefix + 'hashes/package.json')
})

test('ignore node_modules', async t => {
  let files = await getNpmFiles(fixture('no-node_modules'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'no-node_modules/index.js')
  t.is(base(files[1]), 'no-node_modules/package.json')
})

test('ignore nested `node_modules` with .npmignore **', async t => {
  let files = await getNpmFiles(fixture('nested-node_modules'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'nested-node_modules/index.js')
  t.is(base(files[1]), 'nested-node_modules/package.json')
})

test('include `main` even if not in files', async t => {
  let files = await getNpmFiles(fixture('always-include-main'))
  files = files.sort(alpha)
  t.is(files.length, 3)
  t.is(base(files[0]), 'always-include-main/a.js')
  t.is(base(files[1]), 'always-include-main/package.json')
  t.is(base(files[2]), 'always-include-main/woot.js')
})

test('support whitelisting with .npmignore and !', async t => {
  let files = await getNpmFiles(fixture('negation'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'negation/a.js')
  t.is(base(files[1]), 'negation/package.json')
})

test('support `now.files`', async t => {
  let files = await getNpmFiles(fixture('now-files'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'now-files/b.js')
  t.is(base(files[1]), 'now-files/package.json')
})

test('support docker', async t => {
  let files = await getDockerFiles(fixture('dockerfile'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'dockerfile/Dockerfile')
  t.is(base(files[1]), 'dockerfile/a.js')
})

test('prefix regression', async t => {
  let files = await getNpmFiles(fixture('prefix-regression'))
  files = files.sort(alpha)
  t.is(files.length, 2)
  t.is(base(files[0]), 'prefix-regression/package.json')
  t.is(base(files[1]), 'prefix-regression/woot.js')
})
