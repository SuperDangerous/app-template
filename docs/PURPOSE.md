# EpiSensor App Template Purpose

## What This Template Is

The EpiSensor App Template is a **thin branding layer** on top of the @episensor/app-framework. It provides:

1. **EpiSensor Visual Identity**
   - Company logo assets (`/assets/episensor-dark.svg`)
   - Brand colors (primary: #E21350)
   - Consistent styling across internal apps

2. **Pre-configured Setup**
   - Port assignments following company standards
   - Tauri configuration for desktop packaging
   - Development environment setup

3. **Example Code**
   - Sample API routes demonstrating patterns
   - Example pages showing UI component usage
   - WebSocket integration examples
   - File upload handling examples

## What This Template Is NOT

- **NOT a framework** - All core functionality comes from @episensor/app-framework
- **NOT for external use** - This contains EpiSensor-specific branding
- **NOT where generic code belongs** - Generic utilities should be in the framework

## Why Keep It Thin?

1. **Easier Updates** - When the framework updates, minimal changes needed
2. **Clear Ownership** - Easy to see what's EpiSensor-specific vs generic
3. **Faster Onboarding** - New developers see exactly what makes an app "EpiSensor"
4. **Reduced Maintenance** - Less code = fewer bugs

## Template Contents Explained

### `/src` Directory

**Purpose**: Example implementations only

- `api/` - Example routes showing how to use framework features
- `middleware/` - App-specific middleware (most should be in framework)
- `config.ts` - App-specific configuration schema
- `index.ts` - Minimal server setup using StandardServer

### `/web` Directory

**Purpose**: Frontend with EpiSensor styling

- `App.tsx` - Uses AppShell with EpiSensor colors and logo
- `pages/` - Example pages demonstrating UI patterns
- `contexts/` - WebSocket context for real-time features
- `lib/api.ts` - Simple API client utilities

### `/assets` Directory

**Purpose**: EpiSensor brand assets

- Company logos
- Icons for desktop packaging
- Any EpiSensor-specific imagery

### Configuration Files

- `app.json` - Application metadata with EpiSensor defaults
- `package.json` - Configured to use framework tools
- `src-tauri/` - Desktop packaging configuration

## How to Use This Template

1. **Clone it** - Start every new EpiSensor app from this template
2. **Rename it** - Update app.json with your app's name and details
3. **Keep example code** - Use as reference, delete what you don't need
4. **Don't add generic code** - Put reusable code in the framework instead

## When to Modify the Template

✅ **DO modify when:**
- Updating EpiSensor branding
- Changing company-wide port standards
- Adding new example patterns
- Updating to newer framework versions

❌ **DON'T modify when:**
- Adding generic utilities (add to framework)
- Creating reusable components (add to framework)
- Implementing common middleware (add to framework)
- Building features specific to one app (keep in that app)

## Relationship to Other Repos

```
@episensor/app-framework (Public, MIT)
    ↓ provides functionality
epi-app-template (Internal)
    ↓ used as starting point
Your EpiSensor App (Internal)
```

Each app built from this template should:
1. Keep the EpiSensor branding
2. Use the framework's features
3. Add only app-specific code
4. Not duplicate framework functionality
