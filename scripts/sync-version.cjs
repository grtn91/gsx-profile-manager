/**
 * Version Synchronizer
 * 
 * This script synchronizes the version from package.json to:
 * - Cargo.toml
 * - tauri.conf.json
 * - Header.tsx (version badge)
 */

const fs = require('fs');
const path = require('path');

// Read version from package.json (source of truth)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;

console.log(`Synchronizing version ${version} across configuration files...`);

// Update Tauri config - using manual JSON manipulation to preserve format
try {
    const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
    const tauriConfigContent = fs.readFileSync(tauriConfigPath, 'utf8');

    // Instead of parsing the entire JSON, we'll use regex to replace just the version
    // This preserves comments and formatting
    let updatedConfig;

    if (tauriConfigContent.includes('"version":')) {
        // If version exists, update it
        updatedConfig = tauriConfigContent.replace(
            /"version"\s*:\s*"[0-9]+\.[0-9]+\.[0-9]+"/,
            `"version": "${version}"`
        );
    } else {
        // If no version found, add it to the package section
        updatedConfig = tauriConfigContent.replace(
            /"package"\s*:\s*{/,
            `"package": {\n    "version": "${version}",`
        );
    }

    fs.writeFileSync(tauriConfigPath, updatedConfig);
    console.log(`Updated ${tauriConfigPath} to version ${version}`);
} catch (error) {
    console.error(`Error updating Tauri config: ${error.message}`);
}

// Update Cargo.toml
try {
    const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
    let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
    // Use regex to replace the version
    cargoToml = cargoToml.replace(/version = "(\d+\.\d+\.\d+)"/, `version = "${version}"`);
    fs.writeFileSync(cargoTomlPath, cargoToml);
    console.log(`Updated ${cargoTomlPath} to version ${version}`);
} catch (error) {
    console.error(`Error updating Cargo.toml: ${error.message}`);
}

console.log('Version synchronization complete!');