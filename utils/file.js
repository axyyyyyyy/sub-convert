const fs = require('fs');
const path = require('path');

function writeFile(filePath, data) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  fs.writeFileSync(filePath, data);
}

module.exports = {
  writeFile
};