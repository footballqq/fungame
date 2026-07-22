// codex: 2026-07-22 Syntax check script for all JS files including demo.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.join(__dirname, '..');
const jsDir = path.join(baseDir, 'js');
const files = ['geometry.js', 'renderer.js', 'ai.js', 'game.js', 'guide.js', 'demo.js', 'main.js'];

files.forEach(file => {
    const filePath = path.join(jsDir, file);
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        new vm.Script(code);
        console.log(`✓ Syntax OK: ${file}`);
    } catch (err) {
        console.log(`✗ Syntax Error in ${file}: ${err.message}`);
        process.exit(1);
    }
});
