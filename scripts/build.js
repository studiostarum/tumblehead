const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Function to generate a hash from file contents
function generateHash(filePaths) {
    const hashSum = crypto.createHash('sha1');
    
    // Combine contents of all files for hashing
    filePaths.forEach(filePath => {
        const fileBuffer = fs.readFileSync(filePath);
        hashSum.update(fileBuffer);
    });
    
    return hashSum.digest('hex').substring(0, 8);
}

// Main build process
async function build() {
    try {
        // Generate hash from both bundles
        const bundlePaths = [
            path.join(__dirname, '../dist/bundle.min.js'),
            path.join(__dirname, '../dist/bundle.min.css')
        ];
        
        // Ensure both files exist
        bundlePaths.forEach(filePath => {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Bundle file not found: ${filePath}`);
            }
        });
        
        const version = generateHash(bundlePaths);
        
        // Read the loader template
        const loaderPath = path.join(__dirname, '../src/js/loader.js');
        let loaderContent = fs.readFileSync(loaderPath, 'utf8');
        
        // Update version in loader
        loaderContent = loaderContent.replace(
            /const CURRENT_VERSION = '.*?'/,
            `const CURRENT_VERSION = '${version}'`
        );
        
        // Write minified loader to dist
        fs.writeFileSync(
            path.join(__dirname, '../dist/loader.min.js'),
            loaderContent
        );
        
        console.log(`Build completed successfully. New version: ${version}`);
        
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

// Run the build
build(); 