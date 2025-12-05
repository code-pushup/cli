const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Builds the project using Vite. Creates consistent output structure for bundle analysis.
 */
function build() {
  console.log('Building with Vite...');

  try {
    // Clean the dist directory
    const distDir = path.join(__dirname, 'dist', 'vite');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }

    // Run Vite build
    execSync('npx vite build', {
      stdio: 'inherit',
      cwd: __dirname,
    });

    console.log('Vite build completed successfully!');
  } catch (error) {
    console.error('Vite build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  build();
}

module.exports = { build };
