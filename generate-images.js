import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const sourceDir = path.join(__dirname, 'static/photos');
const responsiveDir = path.join(__dirname, 'static/responsive');
const targetSizes = [400, 800, 1200];
const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp'];

// Process a single image
async function processImage(imagePath) {
  try {
    const relativePath = path.relative(sourceDir, imagePath);
    const dir = path.dirname(relativePath);
    const filename = path.basename(imagePath);
    const extension = path.extname(filename).toLowerCase();
    const nameWithoutExt = filename.replace(extension, '');
    
    console.log(`Processing: ${relativePath}`);

    // Create responsive output directory structure
    const responsiveOutputDir = path.join(responsiveDir, dir);
    await fs.mkdir(responsiveOutputDir, { recursive: true });

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const appropriateSizes = targetSizes.filter(size => size < metadata.width);
    
    // Step 1: Convert original to progressive JPEG (in place)
    if (extension === '.jpg' || extension === '.jpeg') {
      console.log(`  Converting original to progressive JPEG...`);
      const tempPath = imagePath + '.tmp';
      
      await sharp(imagePath)
        .jpeg({ 
          quality: 95,        // High quality for originals
          progressive: true,  // Enable progressive loading
          mozjpeg: true      // Better compression
        })
        .toFile(tempPath);
      
      // Replace original with progressive version
      await fs.rename(tempPath, imagePath);
    }
    
    // Step 2: Generate responsive variants in both WebP and JPEG
    for (const width of appropriateSizes) {
      const baseFilename = `${nameWithoutExt}-${width}w`;
      
      // Generate WebP version
      const webpFilename = `${baseFilename}.webp`;
      const webpPath = path.join(responsiveOutputDir, webpFilename);
      
      // Generate JPEG version
      const jpegFilename = `${baseFilename}.jpg`;
      const jpegPath = path.join(responsiveOutputDir, jpegFilename);
      
      // Check if WebP already exists
      try {
        await fs.access(webpPath);
        console.log(`  Skipping ${width}px WebP (already exists)`);
      } catch (err) {
        console.log(`  Creating ${width}px WebP...`);
        await sharp(imagePath)
          .resize({
            width,
            withoutEnlargement: true,
            fit: 'inside'
          })
          .webp({ 
            quality: 80,
            effort: 4
          })
          .toFile(webpPath);
      }
      
      // Check if JPEG already exists
      try {
        await fs.access(jpegPath);
        console.log(`  Skipping ${width}px JPEG (already exists)`);
      } catch (err) {
        console.log(`  Creating ${width}px progressive JPEG...`);
        await sharp(imagePath)
          .resize({
            width,
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ 
            quality: 85,
            progressive: true,
            mozjpeg: true 
          })
          .toFile(jpegPath);
      }
    }
    
    console.log(`  Done with ${filename}\n`);
  } catch (err) {
    console.error(`Error processing ${imagePath}:`, err);
  }
}

// Process all images in a directory and its subdirectories
async function processDirectory(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedFormats.includes(ext)) {
          await processImage(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${directory}:`, err);
  }
}

// Main function
async function main() {
  console.log('Starting comprehensive image processing...');
  console.log(`Source directory: ${sourceDir}`);
  console.log(`Responsive directory: ${responsiveDir}`);
  console.log(`Processing: Progressive JPEGs + WebP + JPEG responsive variants`);
  console.log(`Sizes: ${targetSizes.join(', ')}px\n`);
  
  await fs.mkdir(responsiveDir, { recursive: true });
  await processDirectory(sourceDir);
  
  console.log('\nProcessing complete!');
  console.log('✓ Original photos converted to progressive JPEGs');
  console.log('✓ Responsive WebP variants generated');
  console.log('✓ Responsive JPEG variants generated');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});