const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Set the project root explicitly
config.projectRoot = projectRoot;

// Watch the shared package and workspace node_modules
config.watchFolders = [
  path.resolve(projectRoot, '../shared'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add module resolver for aliases
config.resolver.alias = {
  '@': path.resolve(projectRoot, 'src'),
  '@1000ravier/shared': path.resolve(projectRoot, '../shared/src'),
};

// Resolve node_modules from both workspace root and project root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
