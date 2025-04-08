const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Define icon sizes for iOS
const iosIconSizes = [
  { size: 20, scales: [1, 2, 3] },
  { size: 29, scales: [1, 2, 3] },
  { size: 40, scales: [1, 2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 76, scales: [1, 2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] } // App Store
];

// Define icon sizes for Android
const androidIconSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
  { name: 'playstore', size: 512 } // Google Play Store
];

/**
 * Find React Native project paths
 * @returns {Object} Object containing iOS and Android project paths
 */
function findProjectPaths() {
  const cwd = process.cwd();
  const result = {
    ios: null,
    android: null,
    appName: null
  };

  // Check if we're in a React Native project
  console.log(chalk.blue('\nScanning project structure...'));
  console.log(chalk.gray(`Current directory: ${cwd}`));

  // Find iOS path
  const iosDir = path.join(cwd, 'ios');
  console.log(chalk.gray(`Looking for iOS directory at: ${iosDir}`));

  if (fs.existsSync(iosDir)) {
    console.log(chalk.gray(`iOS directory found. Scanning for .xcodeproj files...`));
    // Look for .xcodeproj files to determine app name
    try {
      const files = fs.readdirSync(iosDir);
      console.log(chalk.gray(`Files in iOS directory: ${files.join(', ')}`));

      const xcodeproj = files.find(file => file.endsWith('.xcodeproj'));

      if (xcodeproj) {
        const appName = xcodeproj.replace('.xcodeproj', '');
        result.appName = appName;
        console.log(chalk.gray(`Found app name: ${appName}`));

        // Check if Images.xcassets exists
        const assetsDir = path.join(iosDir, appName, 'Images.xcassets');
        console.log(chalk.gray(`Looking for assets directory at: ${assetsDir}`));

        const appIconDir = path.join(assetsDir, 'AppIcon.appiconset');

        if (fs.existsSync(assetsDir)) {
          console.log(chalk.gray(`Assets directory found. Looking for AppIcon.appiconset...`));
          // Create AppIcon.appiconset if it doesn't exist
          if (!fs.existsSync(appIconDir)) {
            console.log(chalk.gray(`Creating AppIcon.appiconset directory...`));
            fs.ensureDirSync(appIconDir);
          }
          result.ios = appIconDir;
          console.log(chalk.green(`✓ Found iOS project: ${appName}`));
          console.log(chalk.gray(`AppIcon.appiconset path: ${appIconDir}`));
        } else {
          console.log(chalk.yellow(`⚠ iOS project found but no Images.xcassets directory in ${appName}`));
        }
      } else {
        console.log(chalk.yellow('⚠ iOS directory found but no .xcodeproj file'));
      }
    } catch (error) {
      console.log(chalk.red(`Error scanning iOS directory: ${error.message}`));
    }
  } else {
    console.log(chalk.yellow('⚠ No iOS directory found'));
  }

  // Find Android path
  const androidDir = path.join(cwd, 'android');
  console.log(chalk.gray(`Looking for Android directory at: ${androidDir}`));

  if (fs.existsSync(androidDir)) {
    console.log(chalk.gray(`Android directory found. Looking for res directory...`));
    const androidResDir = path.join(androidDir, 'app', 'src', 'main', 'res');
    console.log(chalk.gray(`Looking for res directory at: ${androidResDir}`));

    if (fs.existsSync(androidResDir)) {
      result.android = androidResDir;
      console.log(chalk.green('✓ Found Android project'));
      console.log(chalk.gray(`Android res directory: ${androidResDir}`));
    } else {
      console.log(chalk.yellow('⚠ Android directory found but no res directory'));
    }
  } else {
    console.log(chalk.yellow('⚠ No Android directory found'));
  }

  // Check if we found any project paths
  if (!result.ios && !result.android) {
    console.log(chalk.yellow('⚠ No React Native project structure detected'));

    // Try to look for project in parent directories (up to 3 levels)
    let currentDir = cwd;
    let found = false;

    for (let i = 0; i < 3; i++) {
      currentDir = path.dirname(currentDir);
      console.log(chalk.gray(`Looking in parent directory: ${currentDir}`));

      const parentIosDir = path.join(currentDir, 'ios');
      const parentAndroidDir = path.join(currentDir, 'android');

      if (fs.existsSync(parentIosDir) || fs.existsSync(parentAndroidDir)) {
        console.log(chalk.green(`✓ Found React Native project in parent directory: ${currentDir}`));
        found = true;

        // Recursively call findProjectPaths with the new directory
        const originalCwd = process.cwd();
        try {
          process.chdir(currentDir);
          const parentResult = findProjectPaths();
          result.ios = parentResult.ios;
          result.android = parentResult.android;
          result.appName = parentResult.appName;
        } catch (error) {
          console.log(chalk.red(`Error scanning parent directory: ${error.message}`));
        } finally {
          process.chdir(originalCwd);
        }

        break;
      }
    }

    if (!found) {
      console.log(chalk.yellow('⚠ No React Native project found in parent directories'));
    }
  }

  return result;
}

/**
 * Generate iOS app icons
 * @param {string} inputPath - Path to the source image
 * @param {string} outputPath - Output directory for generated icons
 * @param {string|null} iosProjectPath - Path to iOS project AppIcon.appiconset directory
 */
async function generateIosIcons(inputPath, outputPath, iosProjectPath) {
  // Create temporary output directory if no project path is found
  const tempOutputPath = path.join(outputPath, 'ios');
  const iosOutputPath = iosProjectPath || tempOutputPath;

  fs.ensureDirSync(iosOutputPath);

  console.log(chalk.blue('\nGenerating iOS icons...'));

  for (const { size, scales } of iosIconSizes) {
    for (const scale of scales) {
      const pixelSize = Math.round(size * scale);
      const fileName = `icon-${size}x${size}@${scale}x.png`;
      const outputFilePath = path.join(iosOutputPath, fileName);

      await sharp(inputPath)
        .resize(pixelSize, pixelSize)
        .toFile(outputFilePath);

      console.log(chalk.green(`✓ Generated: ${fileName} (${pixelSize}x${pixelSize}px)`));
    }
  }

  // Create Contents.json file for Xcode
  const contentsJson = generateIosContentsJson();
  fs.writeFileSync(
    path.join(iosOutputPath, 'Contents.json'),
    JSON.stringify(contentsJson, null, 2)
  );
  console.log(chalk.green('✓ Generated: Contents.json'));

  if (iosProjectPath) {
    console.log(chalk.green(`✓ Icons placed in iOS project: ${iosProjectPath}`));
  } else {
    console.log(chalk.yellow(`⚠ Icons generated in temporary directory: ${tempOutputPath}`));
    console.log(chalk.yellow('  To use these icons, copy the contents to your iOS project\'s AppIcon.appiconset directory'));
  }
}

/**
 * Generate Android app icons
 * @param {string} inputPath - Path to the source image
 * @param {string} outputPath - Output directory for generated icons
 * @param {string|null} androidProjectPath - Path to Android project res directory
 */
async function generateAndroidIcons(inputPath, outputPath, androidProjectPath) {
  // Create temporary output directory if no project path is found
  const tempOutputPath = path.join(outputPath, 'android');
  const androidOutputPath = androidProjectPath || tempOutputPath;

  console.log(chalk.blue('\nGenerating Android icons...'));

  for (const { name, size } of androidIconSizes) {
    if (name === 'playstore') {
      // Special case for Play Store icon
      const playStoreOutputPath = androidProjectPath ? path.join(outputPath, 'android') : tempOutputPath;
      fs.ensureDirSync(playStoreOutputPath);

      const outputFilePath = path.join(playStoreOutputPath, 'playstore-icon.png');
      await sharp(inputPath)
        .resize(size, size)
        .toFile(outputFilePath);
      console.log(chalk.green(`✓ Generated: playstore-icon.png (${size}x${size}px)`));
    } else {
      // Regular app icons
      const dirPath = androidProjectPath ? path.join(androidOutputPath, name) : path.join(tempOutputPath, name);
      fs.ensureDirSync(dirPath);

      const outputFilePath = path.join(dirPath, 'ic_launcher.png');
      await sharp(inputPath)
        .resize(size, size)
        .toFile(outputFilePath);

      // Also create round icons
      const roundOutputFilePath = path.join(dirPath, 'ic_launcher_round.png');
      await sharp(inputPath)
        .resize(size, size)
        .composite([{
          input: Buffer.from(
            `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
          ),
          blend: 'dest-in'
        }])
        .toFile(roundOutputFilePath);

      console.log(chalk.green(`✓ Generated: ${name}/ic_launcher.png (${size}x${size}px)`));
      console.log(chalk.green(`✓ Generated: ${name}/ic_launcher_round.png (${size}x${size}px)`));
    }
  }

  if (androidProjectPath) {
    console.log(chalk.green(`✓ Icons placed in Android project: ${androidProjectPath}`));
  } else {
    console.log(chalk.yellow(`⚠ Icons generated in temporary directory: ${tempOutputPath}`));
    console.log(chalk.yellow('  To use these icons, copy the mipmap-* directories to your Android project\'s res directory'));
  }
}

/**
 * Generate iOS Contents.json file for Xcode
 * @returns {Object} Contents.json object
 */
function generateIosContentsJson() {
  const images = [];

  for (const { size, scales } of iosIconSizes) {
    for (const scale of scales) {
      const fileName = `icon-${size}x${size}@${scale}x.png`;

      let idiom = 'iphone';
      if (size === 76 || size === 83.5) {
        idiom = 'ipad';
      } else if (size === 1024) {
        idiom = 'ios-marketing';
      }

      images.push({
        size: `${size}x${size}`,
        idiom,
        filename: fileName,
        scale: `${scale}x`
      });
    }
  }

  return {
    images,
    info: {
      version: 1,
      author: 'rn-app-icons'
    }
  };
}

/**
 * Generate app icons for specified platforms
 * @param {Object} options - Options for icon generation
 * @param {string} options.inputPath - Path to the source image
 * @param {string} options.outputPath - Output directory for generated icons
 * @param {string} options.platforms - Platforms to generate icons for (ios, android, or both)
 * @param {boolean} options.autoDetect - Whether to auto-detect project paths (default: true)
 * @param {boolean} options.debug - Whether to enable debug mode with verbose logging
 */
async function generateIcons({ inputPath, outputPath, platforms, autoDetect = true, debug = false }) {
  console.log(chalk.gray(`Auto-detect project structure: ${autoDetect ? 'enabled' : 'disabled'}`));

  // Find project paths if auto-detect is enabled
  const projectPaths = autoDetect ? findProjectPaths() : { ios: null, android: null };

  // Log the detected paths
  if (autoDetect) {
    console.log(chalk.gray('Detected project paths:'));
    console.log(chalk.gray(`  iOS: ${projectPaths.ios || 'Not found'}`));
    console.log(chalk.gray(`  Android: ${projectPaths.android || 'Not found'}`));
  }

  if (platforms === 'ios' || platforms === 'both') {
    await generateIosIcons(inputPath, outputPath, projectPaths.ios);
  }

  if (platforms === 'android' || platforms === 'both') {
    await generateAndroidIcons(inputPath, outputPath, projectPaths.android);
  }

  console.log(chalk.blue('\nIcon generation complete!'));
}

module.exports = {
  generateIcons
};
