import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';


export async function resizeImage(
  inputPath: string, 
  outputDir: string, 
  widths: number[] = [1024, 2048, 3072]
): Promise<string[]> {
  const filename = path.basename(inputPath);
  const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const ext = path.extname(filename).slice(1);
  
  const outputPaths: string[] = [];
  
  for (const width of widths) {
    const outputFilename = `${filenameWithoutExt}-${width}w.${ext}`;
    const outputPath = path.join(outputDir, outputFilename);
    
    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true })
      .toFormat(ext as any)
      .jpeg({ quality: 80 })
      .toFile(outputPath);
      
    outputPaths.push(outputPath);
  }
  
  return outputPaths;
}