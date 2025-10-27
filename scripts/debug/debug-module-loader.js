const path = require('path');
const loader = require(path.resolve(__dirname, '../dist/main/handlers/module-loader.js')).collectModuleRegistrations;

if (!loader) {
  console.log('compiled loader not found, trying source...');
  const srcLoader = require(path.resolve(__dirname, '../src/main/handlers/module-loader.ts'));
  console.log('source loader loaded, calling collectModuleRegistrations');
  const regs = srcLoader.collectModuleRegistrations();
  console.log('registrations count:', regs.length);
} else {
  console.log('compiled loader loaded, calling');
  const regs = loader();
  console.log('registrations count:', regs.length);
}
