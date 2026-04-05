import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const mainSrcRoot = path.resolve(appRoot, '..', 'src');
const outputFile = path.resolve(appRoot, 'src', 'data', 'projectSnapshot.json');

const sectionDefinitions = [
  { id: 'pages', label: 'Pages', relativePath: 'pages' },
  { id: 'components', label: 'Components', relativePath: 'components' },
  { id: 'services', label: 'Services', relativePath: 'services' },
  { id: 'hooks', label: 'Hooks', relativePath: 'hooks' },
  { id: 'contexts', label: 'Contexts', relativePath: 'contexts' },
  { id: 'data', label: 'Data', relativePath: 'data' },
  { id: 'utils', label: 'Utils', relativePath: 'utils' },
];

const trackedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json']);

async function collectFiles(directory, relativeBase = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.join(relativeBase, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, relativePath)));
      continue;
    }

    if (trackedExtensions.has(path.extname(entry.name))) {
      files.push(relativePath.replaceAll(path.sep, '/'));
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function buildGroups(files) {
  const groups = new Map();

  for (const file of files) {
    const segments = file.split('/');
    const groupName = segments.length > 1 ? segments[0] : 'root';
    const group = groups.get(groupName) ?? { name: groupName, fileCount: 0, sampleFiles: [] };
    group.fileCount += 1;

    if (group.sampleFiles.length < 4) {
      group.sampleFiles.push(file);
    }

    groups.set(groupName, group);
  }

  return Array.from(groups.values()).sort((left, right) => right.fileCount - left.fileCount);
}

async function buildSection(definition) {
  const absoluteSectionPath = path.resolve(mainSrcRoot, definition.relativePath);
  const sectionStats = await stat(absoluteSectionPath);

  if (!sectionStats.isDirectory()) {
    throw new Error(`Expected directory: ${absoluteSectionPath}`);
  }

  const files = await collectFiles(absoluteSectionPath);

  return {
    id: definition.id,
    label: definition.label,
    relativePath: `src/${definition.relativePath}`,
    totalFiles: files.length,
    groups: buildGroups(files),
    samples: files.slice(0, 12),
  };
}

async function main() {
  const sections = [];

  for (const definition of sectionDefinitions) {
    try {
      sections.push(await buildSection(definition));
    } catch (error) {
      sections.push({
        id: definition.id,
        label: definition.label,
        relativePath: `src/${definition.relativePath}`,
        totalFiles: 0,
        groups: [],
        samples: [],
        missing: true,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const totalFiles = sections.reduce((sum, section) => sum + section.totalFiles, 0);
  const snapshot = {
    generatedAt: new Date().toISOString(),
    sourceRoot: 'src',
    totalFiles,
    sections,
  };

  await writeFile(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  process.stdout.write(`Project snapshot updated at ${outputFile}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});