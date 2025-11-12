const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing Next.js 15 dynamic API routes...');

// Find all dynamic route files
const pattern = 'src/app/api/**/[*]/route.ts';
const files = glob.sync(pattern, { cwd: process.cwd() });

console.log(`Found ${files.length} dynamic route files:`);
files.forEach(file => console.log(`  - ${file}`));

let fixedCount = 0;

files.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Track if any changes were made
  let hasChanges = false;
  
  // Fix 1: Change params type from { id: string } to Promise<{ id: string }>
  const oldParamsType = /{ params }: { params: { id: string } }/g;
  if (oldParamsType.test(content)) {
    content = content.replace(oldParamsType, '{ params }: { params: Promise<{ id: string }> }');
    hasChanges = true;
  }
  
  // Fix 2: Change params.id to await params destructuring
  const oldParamsUsage = /const\s+(\w+)\s*=\s*params\.id/g;
  if (oldParamsUsage.test(content)) {
    content = content.replace(oldParamsUsage, 'const { id: $1 } = await params');
    hasChanges = true;
  }
  
  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files for Next.js 15 async params!`);
