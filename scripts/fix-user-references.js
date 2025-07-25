// Script to help identify and fix user references in E2E tests

const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const files = [
  'test/e2e/videos.e2e.spec.ts',
  'test/e2e/users.e2e.spec.ts',
  'test/e2e/document.e2e.spec.ts',
  'test/e2e/modules.e2e.spec.ts'
];

const replacements = [
  {
    pattern: /await prisma\.user\.deleteMany\(\)/g,
    replacement: `await prisma.userAuthorization.deleteMany();
    await prisma.userSettings.deleteMany();
    await prisma.userProfile.deleteMany();
    await prisma.userIdentity.deleteMany()`
  },
  {
    pattern: /await prisma\.user\.create\(\{[\s\S]*?name:[\s\S]*?email:[\s\S]*?password:[\s\S]*?cpf:[\s\S]*?role:[\s\S]*?\}\);/g,
    replacement: (match) => {
      // Extract values from the original create statement
      const nameMatch = match.match(/name:\s*['"`]([^'"`]+)['"`]/);
      const emailMatch = match.match(/email:\s*['"`]([^'"`]+)['"`]/);
      const passwordMatch = match.match(/password:\s*(hashed|\w+)/);
      const cpfMatch = match.match(/cpf:\s*['"`]([^'"`]+)['"`]/);
      const roleMatch = match.match(/role:\s*['"`]([^'"`]+)['"`]/);

      const name = nameMatch ? nameMatch[1] : 'Test User';
      const email = emailMatch ? emailMatch[1] : 'test@example.com';
      const password = passwordMatch ? passwordMatch[1] : 'hashed';
      const cpf = cpfMatch ? cpfMatch[1] : '12345678900';
      const role = roleMatch ? roleMatch[1] : 'student';

      return `await prisma.userIdentity.create({
      data: {
        email: '${email}',
        password: ${password},
        emailVerified: true,
        profile: {
          create: {
            fullName: '${name}',
            nationalId: '${cpf}',
          }
        },
        authorization: {
          create: {
            role: '${role}',
          }
        }
      },
    })`;
    }
  },
  {
    pattern: /const (\w+) = await prisma\.user\.create/g,
    replacement: 'const $1 = await prisma.userIdentity.create'
  },
  {
    pattern: /prisma\.user\.findUnique/g,
    replacement: 'prisma.userIdentity.findUnique'
  },
  {
    pattern: /prisma\.user\.findMany/g,
    replacement: 'prisma.userIdentity.findMany'
  },
  {
    pattern: /prisma\.user\.findFirst/g,
    replacement: 'prisma.userIdentity.findFirst'
  },
  {
    pattern: /prisma\.user\.update/g,
    replacement: 'prisma.userIdentity.update'
  },
  {
    pattern: /prisma\.user\.delete/g,
    replacement: 'prisma.userIdentity.delete'
  }
];

// Process each file
files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    if (typeof replacement === 'function') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
  });

  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${file}`);
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log('\nDone! Please review the changes manually to ensure correctness.');
console.log('\nNote: You may need to manually adjust:');
console.log('- Variable names that reference user objects');
console.log('- Properties accessed on user objects (e.g., user.name -> user.profile.fullName)');
console.log('- Import statements if UserIdentity types are needed');