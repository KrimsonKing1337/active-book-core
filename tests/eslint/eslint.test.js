import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const eslint = new ESLint({
  cwd: fileURLToPath(new URL('../../', import.meta.url)),
  overrideConfig: {
    languageOptions: {
      parserOptions: { project: null },
    },
  },
});

const lintMessages = async (code, filePath = 'src/components/Video/Video.tsx') => {
  const [result] = await eslint.lintText(code, { filePath });

  return result.messages;
};

const violations = [
  {
    name: 'import grouping',
    code: 'import local from \'./local\';\n\nimport React from \'react\';\n',
    ruleId: 'import-x/order',
    severity: 2,
  },
  {
    name: 'default export warning',
    code: 'export default function Component() { return null; }\n',
    ruleId: 'import-x/no-default-export',
    severity: 1,
  },
  {
    name: 'three destructured properties on one line',
    code: 'const { first, second, third } = input;\n',
    ruleId: 'object-newline/object-newline',
    severity: 2,
  },
  {
    name: 'destructuring with a rest property',
    code: 'const { first, second, ...rest } = input;\n',
    ruleId: 'object-newline/object-newline',
    severity: 2,
  },
  {
    name: 'single quotes',
    code: 'const text = "value";\n',
    ruleId: '@stylistic/quotes',
    severity: 2,
  },
  {
    name: 'required semicolons',
    code: 'const value = 1\n',
    ruleId: '@stylistic/semi',
    severity: 2,
  },
  {
    name: 'required braces',
    code: 'if (ready) run();\n',
    ruleId: 'curly',
    severity: 2,
  },
  {
    name: 'caught error causes',
    code: 'try { run(); } catch (error) { throw new Error(\'failed\'); }\n',
    ruleId: 'preserve-caught-error',
    severity: 2,
  },
  {
    name: 'unused initial assignments',
    code: 'let value = 1;\nvalue = 2;\nuse(value);\n',
    ruleId: 'no-useless-assignment',
    severity: 2,
  },
  {
    name: 'unassigned variables',
    code: 'let value;\nuse(value);\n',
    ruleId: 'no-unassigned-vars',
    severity: 2,
  },
  {
    name: 'unneeded boolean ternary',
    code: 'const value = ready ? true : false;\n',
    ruleId: 'no-unneeded-ternary',
    severity: 2,
  },
  {
    name: 'explicit any warning',
    code: 'const value: any = input;\n',
    ruleId: '@typescript-eslint/no-explicit-any',
    severity: 1,
  },
];

for (const violationCur of violations) {
  test(`preserves ${violationCur.name}`, async () => {
    const messages = await lintMessages(violationCur.code);

    assert(messages.some((message) => {
      return message.ruleId === violationCur.ruleId && message.severity === violationCur.severity;
    }), JSON.stringify(messages));
  });
}

test('accepts two destructured properties split across lines', async () => {
  const messages = await lintMessages('const {\n  first,\n  second,\n} = input;\n');

  assert(!messages.some((message) => message.ruleId === 'object-newline/object-newline'), JSON.stringify(messages));
});

test('accepts compact pairs and expanded triples when destructuring', async () => {
  const snippets = [
    'const { first, second } = input;\n',
    'const {\n  first,\n  second,\n  third,\n} = input;\n',
  ];

  for (const snippetCur of snippets) {
    const messages = await lintMessages(snippetCur);

    assert(!messages.some((message) => message.ruleId === 'object-newline/object-newline'), JSON.stringify(messages));
  }
});

test('preserves React Hooks and focused Jest test checks', async () => {
  const hooks = await lintMessages(`import { useEffect } from 'react';
function Component({ ready }) {
  if (ready) { useEffect(() => {}, []); }
  return null;
}
`);
  const focused = await lintMessages(
    'test.only(\'focused\', () => { expect(true).toBe(true); });\n',
    'src/components/Video/tests/Video.test.tsx',
  );

  assert(hooks.some((message) => message.ruleId === 'react-hooks/rules-of-hooks' && message.severity === 2));
  assert(focused.some((message) => message.ruleId === 'jest/no-focused-tests' && message.severity === 2));
});

test('accepts short value choices, nullish fallbacks and intentional truthy defaults', async () => {
  const snippets = [
    'const value = ready ? \'yes\' : \'no\';\n',
    'const value = current ? current : fallback;\n',
    'const value = preview.hidden ?? item?.hidden ?? false;\n',
    'const value = item?.width ?? 0;\n',
  ];

  for (const snippetCur of snippets) {
    const messages = await lintMessages(snippetCur);

    assert(!messages.some((message) => message.ruleId === 'no-unneeded-ternary'), JSON.stringify(messages));
  }
});

test('preserves the exhaustive dependencies warning', async () => {
  const messages = await lintMessages(`import { useEffect } from 'react';
function Component({ value }) {
  useEffect(() => { consume(value); }, []);
  return null;
}
`);

  assert(messages.some((message) => message.ruleId === 'react-hooks/exhaustive-deps' && message.severity === 1));
});
