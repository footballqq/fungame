import fs from 'fs';
import path from 'path';

export async function generateImage(metadata, outputDir) {
    console.log(`Generating image for: ${metadata.name} in ${outputDir}...`);

    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const imagePath = path.join(outputDir, 'image.png');

    if (fs.existsSync(imagePath)) {
        console.log(`Image already exists at ${imagePath}, skipping.`);
        return;
    }

    // Create a dummy file for now
    fs.writeFileSync(imagePath, 'DUMMY IMAGE CONTENT');
    console.log(`Draft image created at ${imagePath}`);
}
