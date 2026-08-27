# Icon Placeholder

Since this extension requires PNG icons for Chrome, please create icon files with the following specifications:

## Required Icons

1. **icon16.png** - 16x16 pixels (toolbar icon)
2. **icon48.png** - 48x48 pixels (extension management page)
3. **icon128.png** - 128x128 pixels (Chrome Web Store)

## Design Recommendations

- Use a Chinese character (e.g., 中, 学, 字) as the main element
- Background: Blue gradient (#3b82f6 to #2563eb)
- Text color: White
- Simple, clear, and recognizable at small sizes

## How to Create Icons

### Option 1: Online Tools
- Use [Canva](https://www.canva.com) or [Figma](https://www.figma.com)
- Create a square canvas (128x128)
- Add background color and Chinese character
- Export as PNG at required sizes

### Option 2: Using Icon Generator
- Visit [Icon Generator](https://icon.kitchen/)
- Upload your design
- Generate all sizes automatically

### Option 3: Command Line (if you have ImageMagick)
```bash
# Create a simple icon with ImageMagick
convert -size 128x128 xc:#3b82f6 -pointsize 80 -fill white -gravity center -annotate +0+0 "中" icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

## Temporary Solution

For testing purposes, the extension will work even without custom icons. Chrome will use default icons. However, for a professional look, create proper icons before publishing.

## Note

The `manifest.json` currently references these icon files:
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

If you don't have icons yet, you can comment out or remove the "icons" section from `manifest.json` temporarily.
