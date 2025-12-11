# Simply Calendar Embeds

Transform your Google Calendar embeds into beautiful, customizable widgets. Perfect for Squarespace, WordPress, and any website.

**No account required!** Your calendar URL is never stored.

![Simply Calendar Embeds](https://img.shields.io/badge/No_Account-Required-green)

## Features

- 🎨 **Beautiful Styling** - Customize colors, borders, shadows, and fonts
- 📱 **Responsive** - Auto-resizes to fit any container
- 🔲 **Squarespace Optimized** - Special mode for Squarespace websites
- 🌙 **Dark Mode** - Automatic theme detection or manual selection
- ⚡ **Instant Preview** - See changes in real-time
- 🎯 **Presets** - Start with pre-designed templates
- 📋 **Easy Embed** - Copy & paste the generated embed code

## Customization Options

### Basic Settings
- View mode: Month, Week, or Agenda
- Show/hide: Title, Navigation, Date, Tabs, Calendar list, Print button, Timezone

### Styling
- Accent color, Background color, Text color, Border color
- Border radius (0-32px)
- Border width (0-4px)
- Shadow size (None, Small, Medium, Large, Extra Large)
- Font family selection

### Advanced
- Custom width and height
- Min/max height constraints
- Aspect ratio (16:9, 4:3, 1:1, 3:4, Auto)
- Squarespace mode with container padding
- Responsive resizing

## Getting Started

1. **Get your Google Calendar URL**
   - Go to Google Calendar
   - Click Settings → Calendar settings
   - Find "Integrate calendar"
   - Copy the embed code or calendar ID

2. **Customize your embed**
   - Paste the URL into Simply Calendar Embeds
   - Adjust styling options to match your website
   - Preview changes in real-time

3. **Copy & Paste**
   - Click "Copy Code" to copy the embed code
   - Paste into your website's HTML block

## Development

This repository is a monorepo using [Turborepo](https://turbo.build).

### Setup

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Monorepo**: Turborepo

## License

MIT