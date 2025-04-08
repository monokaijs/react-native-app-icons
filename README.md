# RN App Icons

A command-line tool to generate app icons for React Native applications from a single source image.

## Features

- Generate iOS and Android app icons from a single source image
- Automatically resize images to all required dimensions
- Create round icons for Android
- Generate Contents.json file for iOS
- Auto-detect React Native project structure and place icons in the correct locations
- Simple command-line interface

## Installation

### Global Installation

```bash
npm install -g rn-app-icons
```

### Local Installation

```bash
npm install --save-dev rn-app-icons
```

## Usage

### Basic Usage

```bash
npx rn-app-icons --input icon.png
```

This will generate all required app icons for both iOS and Android platforms in the `./app-icons` directory.

### Command Line Options

```
Usage: rn-app-icons [options]

Generate app icons for React Native applications

Options:
  -V, --version                output the version number
  -i, --input <path>           Path to the source image (PNG format recommended)
  -o, --output <path>          Output directory for generated icons (default: "./app-icons")
  -p, --platforms <platforms>  Platforms to generate icons for (ios, android, or both) (default: "both")
  -c, --clear                  Clear the output directory before generating new icons (default: false)
  -d, --no-detect              Disable auto-detection of project structure (auto-detection is enabled by default)
  --debug                      Enable debug mode with verbose logging (default: false)
  -h, --help                   display help for command
```

### Examples

Generate icons for iOS only:

```bash
npx rn-app-icons --input icon.png --platforms ios
```

Generate icons for Android only with a custom output directory:

```bash
npx rn-app-icons --input icon.png --platforms android --output ./assets/icons
```

Clear the output directory before generating new icons:

```bash
npx rn-app-icons --input icon.png --clear
```

Disable auto-detection of project structure (auto-detection is enabled by default):

```bash
npx rn-app-icons --input icon.png --no-detect
```

Enable debug mode for troubleshooting:

```bash
npx rn-app-icons --input icon.png --debug
```

## Requirements

- Node.js 14 or higher
- Source image should be at least 1024x1024 pixels (PNG format recommended)
- Square image is required for best results

## Generated Icons

### iOS

Generates all required icon sizes for iOS, including:
- App icon for iPhone and iPad (various sizes)
- App Store icon (1024x1024)
- Contents.json file for Xcode

If a React Native iOS project is detected, icons will be placed directly in the `AppIcon.appiconset` directory.

### Android

Generates all required icon sizes for Android, including:
- Regular app icons for all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Round app icons for all densities
- Play Store icon (512x512)

If a React Native Android project is detected, icons will be placed directly in the appropriate `mipmap-*` directories.

## License

MIT
