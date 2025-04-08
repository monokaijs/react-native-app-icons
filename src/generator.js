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
 * Generate iOS app icons
 * @param {string} inputPath - Path to the source image
 * @param {string} outputPath - Output directory for generated icons
 */
async function generateIosIcons(inputPath, outputPath) {
  const iosOutputPath = path.join(outputPath, 'ios');
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
}

/**
 * Generate Android app icons
 * @param {string} inputPath - Path to the source image
 * @param {string} outputPath - Output directory for generated icons
 */
async function generateAndroidIcons(inputPath, outputPath) {
  const androidOutputPath = path.join(outputPath, 'android');
  fs.ensureDirSync(androidOutputPath);
  
  console.log(chalk.blue('\nGenerating Android icons...'));
  
  for (const { name, size } of androidIconSizes) {
    if (name === 'playstore') {
      // Special case for Play Store icon
      const outputFilePath = path.join(androidOutputPath, 'playstore-icon.png');
      await sharp(inputPath)
        .resize(size, size)
        .toFile(outputFilePath);
      console.log(chalk.green(`✓ Generated: playstore-icon.png (${size}x${size}px)`));
    } else {
      // Regular app icons
      const dirPath = path.join(androidOutputPath, name);
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
      author: 'react-native-app-icons'
    }
  };
}

/**
 * Generate app icons for specified platforms
 * @param {Object} options - Options for icon generation
 * @param {string} options.inputPath - Path to the source image
 * @param {string} options.outputPath - Output directory for generated icons
 * @param {string} options.platforms - Platforms to generate icons for (ios, android, or both)
 */
async function generateIcons({ inputPath, outputPath, platforms }) {
  if (platforms === 'ios' || platforms === 'both') {
    await generateIosIcons(inputPath, outputPath);
  }
  
  if (platforms === 'android' || platforms === 'both') {
    await generateAndroidIcons(inputPath, outputPath);
  }
  
  console.log(chalk.blue('\nIcon generation complete!'));
  console.log(chalk.gray(`Output directory: ${path.resolve(outputPath)}`));
}

module.exports = {
  generateIcons
};
