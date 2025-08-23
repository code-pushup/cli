# Node Minimal Fixture

This is a minimal TypeScript project fixture for testing bundle analysis tools.

## Build Tools

This project supports multiple build tools:

- **ESBuild**: `npm run build:esbuild`
- **Webpack**: `npm run build:webpack`
- **Rsbuild**: `npm run build:rsbuild`
- **Vite**: `npm run build:vite` ✨ (newly added)

## Vite Configuration

The Vite build configuration includes:

- **Entry Points**: 
  - `index.html` → `main.js` (main application)
  - `src/bin.ts` → `bin.js` (CLI entry point)
- **Output Directory**: `dist/vite/`
- **Static Assets**: Organized in `static/js/` and `static/[ext]/`
- **Source Maps**: Enabled for debugging
- **Code Splitting**: Automatic chunks in `static/js/async/`

## Project Structure

```
src/
├── index.ts          # Main entry point
├── bin.ts            # CLI entry point
├── styles.css        # CSS styles
└── lib/
    ├── feature-1.ts  # Feature module
    ├── feature-2.ts  # Lazy-loaded feature
    └── utils/        # Utility modules
```

## Usage

```bash
# Build with all tools
npm run build

# Build with Vite only
npm run build:vite
```
