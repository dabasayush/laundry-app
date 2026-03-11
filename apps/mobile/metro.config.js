const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro can see packages in root node_modules,
// but exclude node_modules directories from being watched to avoid EMFILE errors.
config.watchFolders = [monorepoRoot];

// Block watching node_modules inside every workspace app to prevent
// Metro/watchman from opening thousands of file handles.
config.resolver.blockList = [
  // Exclude node_modules at any depth under the monorepo root, EXCEPT the
  // root-level node_modules which Metro needs for package resolution.
  new RegExp(`${escapeRegExp(monorepoRoot)}/apps/.*/node_modules/.*`),
  new RegExp(`${escapeRegExp(monorepoRoot)}/packages/.*/node_modules/.*`),
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Tell Metro where to look for packages.
// Putting the local node_modules first ensures workspace-only packages
// (react-native, expo-router, etc.) are always resolved from the app.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
