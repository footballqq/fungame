import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { generateMetadata } from './metadata-generator.js';
import { generateImage } from './image-generator.js';

const program = new Command();

program
    .name('resource-gen')
    .description('CLI to generate game resources')
    .version('1.0.0');

program.command('init')
    .description('Initialize resource directories')
    .action(() => {
        console.log('Initializing resources at:', config.resourcesDir);
        if (!fs.existsSync(config.resourcesDir)) {
            fs.mkdirSync(config.resourcesDir, { recursive: true });
        }
        const cardsDir = path.join(config.resourcesDir, 'cards');
        if (!fs.existsSync(cardsDir)) {
            fs.mkdirSync(cardsDir);
        }
        console.log('Initialization complete.');
    });

program.command('gen')
    .description('Generate resources from input file')
    .argument('<file>', 'Path to input CSV/Text file')
    .action(async (file) => {
        console.log(`Reading from ${file}...`);
        const content = fs.readFileSync(file, 'utf-8');
        const idioms = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        const cardsDir = path.join(config.resourcesDir, 'cards');

        // Load existing manifest or create new
        let manifest = { cards: [] };
        const manifestPath = path.join(config.resourcesDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        }

        for (const idiom of idioms) {
            console.log(`Processing: ${idiom}`);

            // 1. Generate Metadata
            const metadata = await generateMetadata(idiom);

            // 2. Save Metadata
            const cardDir = path.join(cardsDir, metadata.id);
            if (!fs.existsSync(cardDir)) fs.mkdirSync(cardDir, { recursive: true });

            fs.writeFileSync(path.join(cardDir, 'data.json'), JSON.stringify(metadata, null, 2));

            // 3. Update Manifest
            const existingIndex = manifest.cards.findIndex(c => c.id === metadata.id);
            if (existingIndex >= 0) {
                manifest.cards[existingIndex] = metadata;
            } else {
                manifest.cards.push(metadata);
            }

            // 4. Generate Image
            await generateImage(metadata, cardDir);
        }

        // Save Manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('All resources generated and manifest updated.');
    });

program.parse();
