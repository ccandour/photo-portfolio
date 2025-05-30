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
const outputBaseDir = path.join(__dirname, 'static/responsive');
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

    // Create output directory structure
    const outputDir = path.join(outputBaseDir, dir);
    await fs.mkdir(outputDir, { recursive: true });

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const appropriateSizes = targetSizes.filter(size => size < metadata.width);
    
    // Generate each size in both WebP and JPEG
    for (const width of appropriateSizes) {
      const baseFilename = `${nameWithoutExt}-${width}w`;
      
      // Generate WebP version
      const webpFilename = `${baseFilename}.webp`;
      const webpPath = path.join(outputDir, webpFilename);
      
      // Generate JPEG version
      const jpegFilename = `${baseFilename}.jpg`;
      const jpegPath = path.join(outputDir, jpegFilename);
      
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
            effort: 4 // Better compression
          })
          .toFile(webpPath);
      }
      
      // Check if JPEG already exists
      try {
        await fs.access(jpegPath);
        console.log(`  Skipping ${width}px JPEG (already exists)`);
      } catch (err) {
        console.log(`  Creating ${width}px JPEG...`);
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
  console.log('Starting modern image generation...');
  console.log(`Source directory: ${sourceDir}`);
  console.log(`Output directory: ${outputBaseDir}`);
  console.log(`Generating sizes: ${targetSizes.join(', ')}px`);
  console.log('Formats: WebP + JPEG fallbacks\n');
  
  await fs.mkdir(outputBaseDir, { recursive: true });
  await processDirectory(sourceDir);
  
  console.log('\nAll modern images generated!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});