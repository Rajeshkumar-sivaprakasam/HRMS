const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.module.scss')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'components'));
const prefix = `@use '../../styles/variables' as v;\n@use '../../styles/mixins' as m;\n`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@use') && content.includes('variables')) {
    // Already has it, or has old prepended stuff
    content = content.replace(/@use.*?;/g, '').trim();
  }
  
  // Calculate relative path to styles
  const depth = file.split(path.sep).length - path.join(__dirname, 'components').split(path.sep).length;
  let relPath = '../'.repeat(depth) + 'styles';
  
  const inject = `@use '${relPath}/variables' as v;\n@use '${relPath}/mixins' as m;\n\n`;
  fs.writeFileSync(file, inject + content.trim() + '\n');
});

console.log('Injected explicit imports into ' + files.length + ' files.');
