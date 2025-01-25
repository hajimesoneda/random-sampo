import { execSync } from "child_process";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const componentsFile = join(__dirname, '..', 'shadcn-components.json');

if (!fs.existsSync(componentsFile)) {
  console.error(`Error: ${componentsFile} not found.`);
  process.exit(1);
}

const componentsData = JSON.parse(fs.readFileSync(componentsFile, 'utf8'));

if (!Array.isArray(componentsData.components)) {
  console.error('Error: Invalid format in shadcn-components.json. Expected an array of component names.');
  process.exit(1);
}

componentsData.components.forEach((component) => {
  try {
    console.log(`Adding ${component}...`);
    execSync(`npx shadcn@latest add ${component}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error adding ${component}:`, error);
  }
});

console.log('All components added successfully!');

