import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

function writeFile(filePath, data) {
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
  writeFileSync(filePath, data);
}

export { writeFile };