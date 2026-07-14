// Empty stub for optional Nest/class-transformer dependencies this app never
// installs or uses (microservices transport, class-transformer's decorator
// storage). Nest/class-transformer only `require()` these lazily behind a
// runtime feature check, but esbuild (wrangler's bundler) resolves every
// `require()` statically, so without this alias the build fails outright.
module.exports = {};
