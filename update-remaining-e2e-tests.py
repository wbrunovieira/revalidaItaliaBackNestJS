#!/usr/bin/env python3
import os
import re

# List of files that need to be updated
test_files = [
    'test/e2e/courses.e2e.spec.ts',
    'test/e2e/document.e2e.spec.ts',
    'test/e2e/lessons.e2e.spec.ts',
    'test/e2e/modules.e2e.spec.ts',
    'test/e2e/students.e2e.spec.ts',
    'test/e2e/tracks.e2e.spec.ts',
    'test/e2e/videos.e2e.spec.ts',
    'test/e2e/assessment/get-questions-detailed.e2e.spec.ts',
]

for file_path in test_files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if already updated
    if 'E2ETestModule' in content:
        print(f"Already updated: {file_path}")
        continue
    
    # Add import for E2ETestModule
    if "import { Test" in content:
        content = content.replace(
            "import { Test } from '@nestjs/testing';",
            ""
        )
    elif "import { Test," in content:
        content = re.sub(
            r"import \{ Test,([^}]+)\} from '@nestjs/testing';",
            r"import {\1} from '@nestjs/testing';",
            content
        )
    
    # Add E2ETestModule import after AppModule import
    content = re.sub(
        r"(import \{ AppModule \} from[^;]+;)",
        r"\1\nimport { E2ETestModule } from '../test-helpers/e2e-test-module';",
        content
    )
    
    # Fix path for assessment subdirectory
    if 'test/e2e/assessment/' in file_path:
        content = content.replace(
            "from '../test-helpers/e2e-test-module';",
            "from '../../test-helpers/e2e-test-module';"
        )
    
    # Replace Test.createTestingModule pattern
    content = re.sub(
        r"const moduleRef = await Test\.createTestingModule\(\{\s*imports: \[AppModule\],?\s*\}\)\.compile\(\);\s*app = moduleRef\.createNestApplication\(\);\s*(?:app\.useGlobalPipes[^;]+;\s*)?await app\.init\(\);",
        "const { app: testApp } = await E2ETestModule.create([AppModule]);\n    app = testApp;",
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Alternative pattern
    content = re.sub(
        r"const moduleRef = await Test\.createTestingModule\(\{\s*imports: \[AppModule\],?\s*\}\)\.compile\(\);\s*app = moduleRef\.createNestApplication\(\);\s*await app\.init\(\);",
        "const { app: testApp } = await E2ETestModule.create([AppModule]);\n    app = testApp;",
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Write the updated content
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Updated: {file_path}")

print("\nAll files updated!")