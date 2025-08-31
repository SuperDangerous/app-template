# Icon Assets

This directory contains icon files for applications.

## EpiSensor Brand Icon

- `icon.png` - The official EpiSensor logo in PNG format

## For Tauri Applications

When creating a Tauri application, copy this icon to `src-tauri/icons/icon.png` and then generate the required formats using:

```bash
# Generate required icon sizes
magick icon.png -resize 32x32 32x32.png
magick icon.png -resize 128x128 128x128.png  
magick icon.png -resize 256x256 128x128@2x.png
magick icon.png -resize 256x256 -format ico icon.ico
magick icon.png -resize 512x512 -format icns icon.icns
```

Or use the Tauri CLI:
```bash
npx tauri icon src-tauri/icons/icon.png
```

## Usage Guidelines

- Use the EpiSensor icon for all official applications
- Maintain brand consistency across all projects
- Don't modify the icon colors or proportions