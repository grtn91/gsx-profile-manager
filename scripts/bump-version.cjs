/**
 * Version Bumper
 * 
 * This script bumps the version in package.json and then synchronizes
 * it across all config files.
 * 
 * Usage: 
 *   node bump-version.js patch|minor|major
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version type from command line (patch, minor, major)
const versionType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major'];

if (!validTypes.includes(versionType)) {
    console.error(`Error: Version type must be one of ${validTypes.join(', ')}`);
    process.exit(1);
}

// Use npm to bump version in package.json
console.log(`Bumping ${versionType} version...`);
try {
    execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });
} catch (error) {
    console.error('Error bumping version:', error.message);
    process.exit(1);
}

// Run the sync script to update all configs
console.log('Synchronizing version across files...');
try {
    require('./sync-version.cjs');
} catch (error) {
    console.error('Error synchronizing version:', error.message);
    process.exit(1);
}

// Get the new version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
console.log(`\nVersion bump complete! New version: ${packageJson.version}`);
console.log('\nRemember to commit these changes with:');
console.log(`git commit -am "Bump version to v${packageJson.version}"`);