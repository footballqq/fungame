import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export async function generateMetadata(idiomName) {
    console.log(`Generating metadata for: ${idiomName}...`);

    if (config.useMock) {
        return await mockLLMCall(idiomName);
    }

    // TODO: Implement real LLM call
    return await mockLLMCall(idiomName);
}

async function mockLLMCall(idiomName) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        id: window_pinyin(idiomName), // Simple pinyin mock
        name: idiomName,
        period: "东汉",
        year_estimate: 200,
        meaning: "Mock meaning for " + idiomName,
        story: "Mock story content for " + idiomName + ". This is a placeholder.",
        prompt: `Trading card style, ancient chinese, illustration of ${idiomName}`
    };
}

function window_pinyin(str) {
    // Very basic mock pinyin generator for IDs (e.g., 桃园结义 -> taoyuanjieyi)
    // In real app, use a library or just hash it/use LLM output
    return 'id_' + Math.random().toString(36).substr(2, 9);
}
