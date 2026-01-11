import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
    // Paths
    rootDir: path.resolve(__dirname, '..'),
    resourcesDir: path.resolve(__dirname, '../../../history/resources'), // Pointing to history/resources as per design
    manifestFile: 'manifest.json',

    // API Keys (Placeholders for now)
    llmApiKey: process.env.LLM_API_KEY || 'MOCK_KEY',
    imageGenApiKey: process.env.IMAGE_GEN_API_KEY || 'MOCK_KEY',

    // Feature Flags
    useMock: true
};
