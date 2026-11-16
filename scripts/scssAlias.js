import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, '..');
const defaultOutputDirectory = path.join(repositoryRoot, 'lib/src');
const atRulePattern = /^@(use|forward|import)\b/i;

const isAliasPath = (val) => /^~[A-Za-z_][A-Za-z0-9_-]*(?:\/|$)/.test(val);

const isFile = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const getPossibleFilePaths = (filePath) => {
  if (path.extname(filePath)) {
    return [filePath];
  }

  const directory = path.dirname(filePath);
  const fileName = path.basename(filePath);

  return [
    filePath,
    `${filePath}.scss`,
    `${filePath}.sass`,
    `${filePath}.css`,
    path.join(directory, `_${fileName}.scss`),
    path.join(directory, `_${fileName}.sass`),
    path.join(filePath, '_index.scss'),
    path.join(filePath, 'index.scss'),
    path.join(filePath, '_index.sass'),
    path.join(filePath, 'index.sass'),
  ];
};

const resolveAlias = ({ alias, filePath, outputDirectory }) => {
  const aliasPath = alias.slice(1);
  const hasInterpolation = aliasPath.includes('#{') || aliasPath.includes('$');

  if (hasInterpolation) {
    throw new Error(`Dynamic alias paths are not supported: ${alias}`);
  }

  const suffixStart = aliasPath.search(/[?#]/);
  const relativeTarget = suffixStart === -1 ? aliasPath : aliasPath.slice(0, suffixStart);
  const suffix = suffixStart === -1 ? '' : aliasPath.slice(suffixStart);
  const targetPath = path.resolve(outputDirectory, relativeTarget);
  const relativeToRoot = path.relative(outputDirectory, targetPath);

  const isOutsideOutput = relativeToRoot === '..'
    || relativeToRoot.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativeToRoot);

  if (!relativeTarget || isOutsideOutput) {
    throw new Error(`Invalid alias path: ${alias}`);
  }

  const targetExists = getPossibleFilePaths(targetPath).some(isFile);

  if (!targetExists) {
    throw new Error(`Alias target not found: ${alias} (in ${filePath})`);
  }

  const relativePath = path.relative(path.dirname(filePath), targetPath);
  const normalizedPath = relativePath.split(path.sep).join('/');
  const prefixedPath = normalizedPath.startsWith('.') ? normalizedPath : `./${normalizedPath}`;

  return `${prefixedPath}${suffix}`;
};

const findStringEnd = (content, startIndex) => {
  const quote = content[startIndex];

  for (let index = startIndex + 1; index < content.length; index += 1) {
    if (content[index] === '\\') {
      index += 1;

      continue;
    }

    if (content[index] === quote) {
      return index;
    }
  }

  throw new Error('Unterminated string in SCSS');
};

const skipComment = (content, startIndex) => {
  if (content.startsWith('/*', startIndex)) {
    const endIndex = content.indexOf('*/', startIndex + 2);

    if (endIndex === -1) {
      throw new Error('Unterminated block comment in SCSS');
    }

    return endIndex + 2;
  }

  if (content.startsWith('//', startIndex) && content[startIndex - 1] !== ':') {
    const endIndex = content.indexOf('\n', startIndex + 2);

    return endIndex === -1 ? content.length : endIndex + 1;
  }

  return null;
};

const recordAlias = ({ content, startIndex, endIndex, replacements, filePath, outputDirectory }) => {
  const alias = content.slice(startIndex, endIndex);

  if (!isAliasPath(alias)) {
    return;
  }

  const replacement = resolveAlias({
    alias,
    filePath,
    outputDirectory,
  });

  replacements.push({
    startIndex,
    endIndex,
    replacement,
  });
};

const scanUrl = ({ content, startIndex, replacements, filePath, outputDirectory }) => {
  const urlMatch = /^url\s*\(/i.exec(content.slice(startIndex));
  let index = startIndex + urlMatch[0].length;

  while (/\s/.test(content[index] ?? '') && index < content.length) {
    index += 1;
  }

  const hasQuotes = content[index] === '"' || content[index] === "'";
  const pathStart = hasQuotes ? index + 1 : index;

  let pathEnd;

  if (hasQuotes) {
    pathEnd = findStringEnd(content, index);

    index = pathEnd + 1;
  } else {
    const closingIndex = content.indexOf(')', index);

    if (closingIndex === -1) {
      throw new Error('Unterminated url() in SCSS');
    }

    pathEnd = closingIndex;

    while (pathEnd > pathStart && /\s/.test(content[pathEnd - 1])) {
      pathEnd -= 1;
    }

    index = closingIndex;
  }

  recordAlias({
    content,
    startIndex: pathStart,
    endIndex: pathEnd,
    replacements,
    filePath,
    outputDirectory,
  });

  const trailingContent = content.slice(index);
  const closingMatch = /^\s*\)/.exec(trailingContent);

  if (!closingMatch) {
    throw new Error('Invalid url() in SCSS');
  }

  return index + closingMatch[0].length;
};

const isUrlAt = (content, index) => {
  const previousCharacter = content[index - 1];
  const hasValidBoundary = index === 0 || !/[\w-]/.test(previousCharacter);
  const hasUrl = /^url\s*\(/i.test(content.slice(index));

  return hasValidBoundary && hasUrl;
};

const scanAtRule = ({ content, startIndex, replacements, filePath, outputDirectory }) => {
  const match = atRulePattern.exec(content.slice(startIndex));

  let index = startIndex + match[0].length;

  while (index < content.length) {
    const nextIndex = skipComment(content, index);

    if (nextIndex !== null) {
      index = nextIndex;

      continue;
    }

    const currentCharacter = content[index];
    const isQuotedString = currentCharacter === '"' || currentCharacter === "'";

    if (isQuotedString) {
      const endIndex = findStringEnd(content, index);

      recordAlias({
        content,
        startIndex: index + 1,
        endIndex,
        replacements,
        filePath,
        outputDirectory,
      });

      index = endIndex + 1;

      continue;
    }

    if (isUrlAt(content, index)) {
      index = scanUrl({
        content,
        startIndex: index,
        replacements,
        filePath,
        outputDirectory,
      });

      continue;
    }

    if (currentCharacter === ';') {
      return index + 1;
    }

    index += 1;
  }

  return index;
};

export const rewriteScss = ({ content, filePath, outputDirectory }) => {
  const replacements = [];
  let index = 0;

  while (index < content.length) {
    const nextIndex = skipComment(content, index);

    if (nextIndex !== null) {
      index = nextIndex;

      continue;
    }

    const currentCharacter = content[index];
    const isQuotedString = currentCharacter === '"' || currentCharacter === "'";

    if (isQuotedString) {
      index = findStringEnd(content, index) + 1;

      continue;
    }

    if (atRulePattern.test(content.slice(index))) {
      index = scanAtRule({
        content,
        startIndex: index,
        replacements,
        filePath,
        outputDirectory,
      });

      continue;
    }

    if (isUrlAt(content, index)) {
      index = scanUrl({
        content,
        startIndex: index,
        replacements,
        filePath,
        outputDirectory,
      });
      continue;
    }

    index += 1;
  }

  const fragments = [];
  let lastIndex = 0;

  for (const replacementCur of replacements) {
    fragments.push(content.slice(lastIndex, replacementCur.startIndex));
    fragments.push(replacementCur.replacement);

    lastIndex = replacementCur.endIndex;
  }

  fragments.push(content.slice(lastIndex));

  return {
    content: fragments.join(''),
    replacementsCount: replacements.length,
  };
};

const findScssFiles = (directoryPath) => {
  const files = [];

  for (const entryCur of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entryCur.name);

    if (entryCur.isDirectory()) {
      files.push(...findScssFiles(entryPath));
      continue;
    }

    if (entryCur.isFile() && entryCur.name.endsWith('.scss')) {
      files.push(entryPath);
    }
  }

  return files;
};

export const run = (args = process.argv.slice(2)) => {
  const dryRun = args.includes('--dry-run');
  const directoryArg = args.find((cur) => cur !== '--dry-run');

  const outputDirectory = directoryArg
    ? path.resolve(process.cwd(), directoryArg)
    : defaultOutputDirectory;

  const sourceDirectory = path.join(repositoryRoot, 'src');

  if (outputDirectory === sourceDirectory) {
    throw new Error('Cannot modify the source directory');
  }

  if (!fs.existsSync(outputDirectory)) {
    throw new Error(`Output directory not found: ${outputDirectory}`);
  }

  const scssFiles = findScssFiles(outputDirectory);

  const pendingChanges = [];
  let totalReplacements = 0;

  for (const filePath of scssFiles) {
    const originalContent = fs.readFileSync(filePath, 'utf8');

    const result = rewriteScss({
      content: originalContent,
      filePath,
      outputDirectory,
    });

    if (result.replacementsCount > 0) {
      pendingChanges.push({
        filePath,
        content: result.content,
      });

      totalReplacements += result.replacementsCount;
    }
  }

  if (!dryRun) {
    for (const changeCur of pendingChanges) {
      fs.writeFileSync(changeCur.filePath, changeCur.content);
    }
  }

  const actionLabel = dryRun ? 'Dry run' : 'Completed';
  const changesLabel = dryRun ? 'files to update' : 'files updated';

  const logMessage = `[scss-alias] ${actionLabel}: ${scssFiles.length} SCSS files scanned; `
    + `${changesLabel}: ${pendingChanges.length}; replacements: ${totalReplacements}`;

  console.log(logMessage);
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  try {
    run();
  } catch (error) {
    console.error(error);

    process.exitCode = 1;
  }
}
