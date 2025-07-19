# Angular Minimal App

This is a minimal Angular application used for testing bundle statistics.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

## Installation

Install the dependencies:

```bash
npm install
```

## How to Build the App

### Development Build

For development with live reload:

```bash
npm run start
```

This will start the development server at `http://localhost:4200`.

### Production Build

For a production-optimized build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Build with Bundle Statistics

To build with bundle statistics (useful for analyzing bundle size):

```bash
npm run build:stats
```

This generates a `stats.json` file along with the build output, which can be used for bundle analysis.

### Development Build with Watch Mode

For development with automatic rebuilding on file changes:

```bash
npm run watch
```

## Testing

Run unit tests:

```bash
npm run test
```

## Build Output

The built application will be available in the `dist/angular-minimal/` directory after running any build command.
