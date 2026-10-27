import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, '..');
const defaultOutputDirectory = path.join(repositoryRoot, 'lib/src');
const isAliasPath = (val) => /^~[A-Za-z_][A-Za-z0-9_-]*(?:\/|$)/.test(val);

const unquotedPathDelimiters = new Set([
  ' ',
  '\t',
  '\r',
  '\n',
  '"',
  "'",
  '(',
  ')',
  ',',
  ';',
  '{',
  '}',
]);

const isFile = (filePath) => {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const getPossibleFilePaths = (filePath) => {
  const fileExtension = path.extname(filePath);

  if (fileExtension) {
    return [filePath];
  }

  const fileDirectory = path.dirname(filePath);
  const fileName = path.basename(filePath);

  return [
    filePath,
    filePath + '.scss',
    filePath + '.sass',
    filePath + '.css',
    path.join(fileDirectory, '_' + fileName + '.scss'),
    path.join(fileDirectory, '_' + fileName + '.sass'),
    path.join(filePath, '_index.scss'),
    path.join(filePath, 'index.scss'),
    path.join(filePath, '_index.sass'),
    path.join(filePath, 'index.sass'),
  ];
};

const resolveAlias = ({ alias, filePath, outputDirectory }) => {
  const aliasPath = alias.slice(1);

  if (aliasPath.includes('#{') || aliasPath.includes('$')) {
    throw new Error('Динамический путь не поддерживается: ' + alias);
  }

  const pathEnd = aliasPath.search(/[?#]/);
  const relativeTarget = pathEnd === -1 ? aliasPath : aliasPath.slice(0, pathEnd);
  const suffix = pathEnd === -1 ? '' : aliasPath.slice(pathEnd);
  const targetPath = path.resolve(outputDirectory, relativeTarget);
  const targetRelativePath = path.relative(outputDirectory, targetPath);

  const isOutsideOutput = targetRelativePath === '..'
    || targetRelativePath.startsWith('..' + path.sep)
    || path.isAbsolute(targetRelativePath);

  if (!relativeTarget || isOutsideOutput) {
    throw new Error('Недопустимый путь: ' + alias);
  }

  const possibleFilePaths = getPossibleFilePaths(targetPath);
  const targetExists = possibleFilePaths.some(isFile);

  if (!targetExists) {
    throw new Error('Файл не найден для пути ' + alias + ' в ' + filePath);
  }

  const relativePath = path.relative(path.dirname(filePath), targetPath);
  const normalizedPath = relativePath.split(path.sep).join('/');

  const prefixedPath = normalizedPath.startsWith('.')
    ? normalizedPath
    : './' + normalizedPath;

  return prefixedPath + suffix;
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

  throw new Error('Незакрытая строка в SCSS');
};

const rewriteScss = ({ content, filePath, outputDirectory }) => {
  const fragments = [];

  let lastWrittenIndex = 0;
  let replacementsCount = 0;
  let index = 0;

  const appendReplacement = (startIndex, endIndex, alias) => {
    const replacement = resolveAlias({
      alias,
      filePath,
      outputDirectory,
    });

    fragments.push(content.slice(lastWrittenIndex, startIndex));
    fragments.push(replacement);

    replacementsCount += 1;
    lastWrittenIndex = endIndex;
  };

  while (index < content.length) {
    if (content.startsWith('/*', index)) {
      const endIndex = content.indexOf('*/', index + 2);

      index = endIndex === -1 ? content.length : endIndex + 2;

      continue;
    }

    if (content.startsWith('//', index) && content[index - 1] !== ':') {
      const endIndex = content.indexOf('\n', index + 2);

      index = endIndex === -1 ? content.length : endIndex + 1;

      continue;
    }

    const currentCharacter = content[index];
    const isQuotedString = currentCharacter === '"' || currentCharacter === "'";

    if (isQuotedString) {
      const endIndex = findStringEnd(content, index);
      const stringContent = content.slice(index + 1, endIndex);
      const pathIsAlias = isAliasPath(stringContent);

      if (pathIsAlias) {
        appendReplacement(index + 1, endIndex, stringContent);
      }

      index = endIndex + 1;

      continue;
    }

    const isAlias = isAliasPath(content.slice(index));

    const previousCharacter = content[index - 1];

    const hasPathBoundary = index === 0
      || unquotedPathDelimiters.has(previousCharacter)
      || previousCharacter === ':'
      || previousCharacter === '=';

    if (isAlias && hasPathBoundary) {
      let endIndex = index + 1;

      const delimitersHasEndIndex = unquotedPathDelimiters.has(content[endIndex]);

      while (endIndex < content.length && !delimitersHasEndIndex) {
        endIndex += 1;
      }

      const alias = content.slice(index, endIndex);

      appendReplacement(index, endIndex, alias);

      index = endIndex;

      continue;
    }

    index += 1;
  }

  fragments.push(content.slice(lastWrittenIndex));

  return {
    content: fragments.join(''),
    replacementsCount,
  };
};

const findScssFiles = (directoryPath) => {
  const files = [];

  for (const entryCur of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const entryPath = path.join(directoryPath, entryCur.name);
    const entryCurIsDirectory = entryCur.isDirectory();

    if (entryCurIsDirectory) {
      files.push(...findScssFiles(entryPath));
    } else if (entryCur.isFile() && entryCur.name.endsWith('.scss')) {
      files.push(entryPath);
    }
  }

  return files;
};

const run = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const directoryArg = args.find((cur) => cur !== '--dry-run');

  const outputDirectory = directoryArg
    ? path.resolve(process.cwd(), directoryArg)
    : defaultOutputDirectory;

  const sourceDirectory = path.join(repositoryRoot, 'src');

  if (outputDirectory === sourceDirectory) {
    throw new Error('Нельзя изменять исходную директорию src');
  }

  if (!fs.existsSync(outputDirectory)) {
    throw new Error('Выходная директория не найдена: ' + outputDirectory);
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

  const mode = dryRun ? 'Проверено' : 'Обработано';
  const changedMode = dryRun ? 'требуют изменения' : 'изменено';

  const logMessage = `[scss-alias]: ${mode}: ${scssFiles.length} SCSS-файлов, `
    + `${pendingChanges.length} ${changedMode}, `
    + `${totalReplacements} замен`;

  console.log(logMessage);
};

try {
  run();
} catch (error) {
  console.error(error);

  process.exitCode = 1;
}
