# Conditional logic review: core and editor

Review for [core issue #35](https://github.com/KrimsonKing1337/active-book-core/issues/35).
Baseline: core `6ec8c1d`, editor `0fa726d`. Both changes use
`refactor/simplify-conditional-logic`; the issue remains open for review.

## Audit and decisions

The TypeScript AST inventory covered 323 tracked non-test TS/TSX files in core
and 211 in editor, including declaration files. It counted 63/127 conditional
expressions and 56/126 nullish expressions respectively. There were no direct
conditional expressions nested in another conditional's value branches. This
inventory is a search aid, not a proof that expressions are readable or correct.

All five issue examples were checked against current main:

| Example | Current state and decision |
| --- | --- |
| 1. StoryRoot selection | Main already used an `if` for the lookup. Mount the outline explicitly in editor; retain the guarded lookup so reader does no extra search. Missing selection remains valid inside editor. |
| 2. VisualSurfaces target | Replace the placeholder null and two later overwrites with mutually exclusive branches: local region, application feedback, application background, other application planes. Preserve feedback fallback to the story, absent-host skipping, sorting, portal keys and z-index. |
| 3. Background/FrameRenderer content | Render component children at the render site instead of preparing a one-use null value. Preserve all ReactNode children, including zero. Background style selection becomes a short two-way expression; still copy before deleting zIndex. Media readiness hooks remain unconditional. |
| 4. VisualSurface CSS | Keep unchanged. Undefined legitimately omits CSS properties; zero widths and empty side lists have their own meanings. The current width/mask construction is clearer than a larger style builder. |
| 5. VisualRegionSettings anchor/origin | Already resolved on main: anchor defaults to top-left and origin inherits that anchor; JSX reads named values. No further rewrite needed. |

Additional requested examples:

- **A:** Keep VisualSelectionOutline's application-versus-local element ternary.
  It selects two data sources and its local default is short and clear.
- **B:** Keep `preview.hidden ?? item?.hidden ?? false` in FrameSettings.
  Explicit false overrides authored true; replacing this with OR would be wrong.
- **C:** Keep the component-ID empty string in FrameSettings and background
  CustomComponent. Both controlled selects have an explicit empty option. The
  change handlers translate that selection into the domain's undefined component.

The broader audit also reviewed renderer readiness, flashlight/vibration hooks,
FrameText CSS animation absence, preview resolution, authoring defaults, and
pending style updates. Optional hook inputs, animation/frame handles initialized
to null, short same-meaning fallback chains, and meaningful authored-value
fallbacks were retained. Existing incremental overrides are not automatically
bad merely because they use let.

Current source examples: [StoryRoot](../src/components/StoryRoot/StoryRoot.tsx),
[VisualSurfaces](../src/components/VisualSurfaces/VisualSurfaces.tsx),
[VisualSurface CSS](../src/components/VisualSurfaces/components/VisualSurface/VisualSurface.tsx),
[editor frame previews](https://github.com/KrimsonKing1337/active-book-editor/blob/refactor/simplify-conditional-logic/apps/editor/src/components/EditorScreen/components/VisualBookPreview/resolveFramePreview.ts),
and [editor anchor/origin settings](https://github.com/KrimsonKing1337/active-book-editor/blob/refactor/simplify-conditional-logic/apps/editor/src/components/EditorScreen/components/PageEffects/components/VisualRegionSettings/VisualRegionSettings.tsx).

Two additional editor improvements were selected:

- `resolveFramePreview` constructs each optional item under its own presence
  guard. It no longer creates missing/empty lookup keys or normalizes a temporary
  preview through another undefined value. Key formats, output shape, authored
  fallbacks and non-mutating copies are preserved. Tests exercise explicit false,
  zero, empty style objects, absent items, stale previews and authored animation.
- `draftToVisual` selects the style object and final lifetime directly instead of
  initializing values that are subsequently replaced. The original discriminant
  and previous-registration test are preserved; no new normalization is added.

The intended internal lifecycle change is that the selection-outline component
is absent in reader. Book content keeps its identity across mode changes.
Other runtime contracts, domain models, hook call order and visual output are
unchanged. No compatibility layer or universal helper was introduced.

## Proposed AGENTS.md Guidelines

These are proposed additions for discussion, **not changes to AGENTS.md**.
The existing documents already cover general naming, short ternaries, avoiding
excessive helpers, Rules of Hooks and preserving falsy/nullish behavior. The
following rules add specific decision criteria rather than repeat those rules.
All six principles can be shared; repository-specific applications are noted.

### 1. Separate feature eligibility from missing data

**Proposed wording:** "Express whether an operation or UI feature is enabled at
the point where it runs or mounts. Do not encode that decision only by replacing
otherwise available data with a missing value. Keep required hooks unconditional,
and preserve lazy lookups when the feature is disabled."

Why: a missing selection and a reader-only restriction are different states.
Core application: StoryRoot's editor-only selection outline. Editor application:
preview actions whose eligibility is independent of whether a preview exists.

```tsx
// Avoid: absence silently disables an editor feature.
const item = mode === 'editor' ? selected : undefined;
return <Outline item={item} />;

// Prefer when Outline should not exist outside editor.
return (
  <>
    {mode === 'editor' && (
      <Outline item={selected} />
    )}
  </>
);
```

Exception: an optional value is appropriate when the consumer explicitly owns
its disabled/empty state, especially an always-called registration hook.

### 2. Resolve an optional object as a unit

**Proposed wording:** "When several derived fields require the same optional
object, resolve them together after checking that object. Avoid creating an
absent key, looking it up conditionally, and then normalizing the result again.
Keep a short optional access for an isolated field."

Why: one branch makes the item's existence and its fallback sources visible.
Editor example: `resolveFramePreview` now groups each shadow/text's preview,
style, visibility and animation resolution without a new helper.

```ts
// Avoid a chain of temporary absence for one lookup.
const key = shadow ? makeKey(shadow.id) : undefined;
const preview = key ? previews[key] : undefined;

// Prefer when the item has several fields to resolve.
if (shadow) {
  const preview = previews[makeKey(shadow.id)];
  // Resolve this shadow's fields here.
}
```

Exception: `const label = item?.label ?? 'Untitled'` needs no extra branch.
A small shared helper is appropriate only when genuinely shared resolution
logic would otherwise be duplicated, not merely to hide a conditional.

### 3. Keep fallback chains within one semantic choice

**Proposed wording:** "Use a short fallback chain for sources of the same value
in an obvious priority order. If the default depends on a different field or
mode, establish that choice before the chain instead of injecting undefined
inside it. Preserve short-circuit evaluation and meaningful falsy values."

Why: the reader can see both inheritance and source priority. Editor's existing
anchor/origin values are the positive example; FrameSettings' hidden chain is
also intentionally retained.

```ts
// Avoid mixing property selection with manufactured absence.
const value = placement[property]
  ?? (property === 'origin' ? placement.anchor : undefined)
  ?? 'top-left';

// Prefer for the two known fields.
const anchor = placement.anchor ?? 'top-left';
const origin = placement.origin ?? anchor;
```

Exception: `preview.hidden ?? item?.hidden ?? false` is already a clear priority
chain. A truthiness-based OR is legitimate when empty strings or zero really
should select the fallback; do not replace it mechanically.

### 4. Assign branch results without placeholder states

**Proposed wording:** "For mutually exclusive selection branches, assign the
final result in each branch or use a simple two-way conditional. Avoid a null,
empty object, or provisional value that exists only to be overwritten. Keep a
real default-and-override sequence when it communicates actual precedence."

Why: portal destination selection should describe destinations, not intermediate
states. This applies to core hosts and editor authoring lifetime/style choices.

```ts
// Avoid an initial value with no meaningful use.
let target = external ? null : hosts[region];
if (external) {
  target = applicationHost;
}

// Prefer mutually exclusive assignment.
let target;
if (external) {
  target = applicationHost;
} else {
  target = hosts[region];
}
```

Exception: a named intermediate can clarify meaning, preserve a value for later
cleanup, or avoid repeated expensive work. Let is useful for genuine staged
updates. Prefer `const target = external ? applicationHost : localHost` when the
choice is this simple; do not expand every ternary into a branch block.

### 5. Adapt absence at the boundary that defines it

**Proposed wording:** "Choose the representation of absence according to the
receiving API. Keep conversions between domain values and UI/CSS/hook values
close to that boundary; do not impose one absence representation everywhere."

Why: replacing all empty strings with undefined can break controlled selects;
removing explicit style undefined can retain a previous CSS property.

Examples to keep:

```ts
// Core: no inline override; CSS can supply its normal value.
const animationName = isStatic ? 'none' : undefined;

// Editor: the select explicitly has <option value="">No component</option>.
const componentId = component
  ? customVisualDefinitionId('frame', `${component.package}/${component.name}`)
  : '';

// Core: the hook stays unconditional and defines null as no registration.
useFrameEffect(effect);
```

Exception: null/undefined are valid domain or lifecycle values, including refs,
cleanup handles and empty React output. A conversion such as `value ?? undefined`
is justified when it normalizes a real nullable input for an API; it is redundant
when the input is already undefined-or-value by construction.

### 6. Treat JSX guards as lifecycle decisions

**Proposed wording:** "Before changing conditional mounting, check whether the
child owns state, subscriptions or cleanup. Preserve that lifecycle unless the
feature genuinely should be absent. When a numeric value can reach a JSX guard,
use an explicit boolean condition so zero is not rendered accidentally."

Why: hiding a feature, unmounting it and supplying an empty value are not always
interchangeable. Share this rule; core needs particular care with portals/media,
while editor needs care with controlled fields, previews and persistent state.

```tsx
// Avoid when zero means 'no items', not text to render.
{items.length && (
  <List items={items} />
)}

// Prefer an explicit visibility predicate.
{items.length > 0 && (
  <List items={items} />
)}
```

Exception: rendering the count itself is valid, and a short prop-value ternary
can be clearer than extra variables. Do not move hooks behind a guard. Copy
shared style/authoring objects before editing them, and do not move side effects
or expensive fallback construction across guards for cosmetic simplification.

## Proposed ESLint Rules

No ESLint configuration or dependency was changed for these proposals.
Installed versions: ESLint 10.14.0, typescript-eslint 8.72.1 and Stylistic 5.10.0.
Both installed plugins explicitly accept ESLint 10. Core already supplies parser
project information; editor currently does not. Typed recommendations therefore
require an appropriate workspace/test project setup in editor first.

The six syntax-only bad/good pairs below were executed through ESLint's Linter
API with the installed TypeScript parser; only transient in-memory configuration
was used. A transient source audit using the three proposed syntax checks
(no-unneeded-ternary, no-nested-ternary, the selector) reported no current matches
in either repository. These checks would prevent regressions but would not have
identified every issue reviewed here.

| Rule and proposed level | Problem, rejected example, accepted example | Limits / false positives | Compatibility, dependency and fixing |
| --- | --- | --- | --- |
| `no-unneeded-ternary: [error, { defaultAssignment: true }]` | Boolean re-encoding: reject `ready ? true : false`; allow `!!ready` and `ready ? first : second`. | Do not rewrite the first expression as a possibly non-boolean `ready`. Keep defaultAssignment true to leave intentional truthy defaults alone. | ESLint 10 built-in; no dependency. Boolean-coercion autofixes are generally safe, subject to normal diff review. |
| `no-nested-ternary: warn` | Reject `a ? b : c ? d : e`; allow a single value-choice ternary. | Can flag compact, readable three-way selection or JSX. A warning is a review prompt, not a requirement to create a large if/helper for every match. | Built-in; no dependency; no autofix. |
| `no-useless-assignment` and `no-unassigned-vars`: keep existing error | Reject `let target = null; target = host; use(target)` or a never-assigned local read; allow final branch assignments and real state accumulation. | Dataflow cannot reliably recognize every conditionally dead initializer, including the original portal-host pattern. It does not judge whether an intermediate is conceptually useful. | Already enabled via the recommended core rules in both repos. No dependency or autofix; retain initializer side effects when rewriting manually. |
| `no-unsafe-optional-chaining`: keep existing error | Reject `(item?.node).id`; allow `item?.node?.id` or an explicit presence guard. | Does not catch every unsafe use, and does not decide whether a fallback or exception is the right contract. Keep arithmetic checking at its current default rather than imposing broad changes. | Already enabled in both. No dependency or autofix. |
| `@typescript-eslint/no-unnecessary-condition`: off now; consider warn after type-model review | With reliable types, reject `if (knownObject) ...` when it cannot be absent; allow `if (optionalObject) ...`. | Sparse `Record<string, FrameItemPreview>` / style maps return undefined at runtime despite optimistic indexed-access types. Removing their guards based on this rule could break real behavior. Closures and external data can also defeat narrowing. | Installed and ESLint-10-compatible; needs type information and strict null checking. No extra package. Suggestions require manual semantic review, not automatic application. |
| `@typescript-eslint/prefer-nullish-coalescing`: off globally; optional warn in carefully selected typed code | Reject unnecessary `value != null ? value : fallback`; allow `value ?? fallback`. | `title || 'Untitled'` may intentionally replace empty titles, and `delay || default` may intentionally replace zero. This rule cannot infer that intent. Any trial should ignore mixed logical expressions and conditional-test usage. | Installed; requires typed linting. No extra package. Offers suggestions, not a safe global behavior-preserving rewrite of OR. |
| `@typescript-eslint/strict-boolean-expressions`: off | Can reject nullable numeric truthiness; allow explicit `count !== undefined`. | Restrictive options also expand clear `if (node)`/optional-flag code. Defaults allow non-null numbers, so this is not by itself a complete JSX zero-leak check. | Installed; requires types. No package; do not mass-apply suggestions. |
| `@stylistic/multiline-ternary`: off for this goal; optional `[warn, always-multiline]` after style agreement | Reject partially broken multi-line operands; allow fully split operands and short one-line value choices. | Only formatting; does not detect mixed responsibilities, unnecessary absence or excessive complexity. Never choose always merely to expand clear short expressions. | Installed 5.10.0 accepts ESLint 10. No package. Whitespace fixes are suitable for reviewed changed lines, not an unrelated repository-wide fix run. |
| `no-restricted-syntax`: off globally; optional warn pilot with the selector below | Flag a conditional undefined branch directly inside a nullish chain; allow `origin ?? anchor ?? 'top-left'`, ordinary ternaries and plain nullish chains. | A genuine lazy optional backup may fit this syntax and still be clear. Selectors cannot inspect domain meaning, value provenance or mount/cleanup intent. | Built-in, tested with the installed parser. No package or autofix. Do not combine it with blanket bans on ternaries, optional chaining or JSX expressions. |

A tested candidate selector (proposal only):

```js
{
  selector: "LogicalExpression[operator='??'] > ConditionalExpression:matches([consequent.name='undefined'], [alternate.name='undefined'])",
  message: 'Review conditional absence inside a fallback chain.',
}
```

It flags the old anchor/origin pattern, but not the already-clear hidden preview
chain. A selector for every ternary returning undefined or every JSX ternary
would incorrectly flag optional media sources, CSS properties and controlled
props, so it is not recommended.

### React safety and third-party alternatives

- **`react-hooks/rules-of-hooks`:** keep error in core. Core has compatible
  `eslint-plugin-react-hooks` 7.1.1; editor has no such direct plugin. A separate
  proposal could add that compatible dependency and enable error in editor.
  Reject an ordinary hook behind an if; allow unconditional hooks with optional
  inputs. Modern React's special `use` API has its own supported exceptions.
  This check has no general autofix and cannot prove state/cleanup equivalence
  when an entire child component is mounted conditionally.
- **`react/jsx-no-leaked-render`:** useful conceptually for `count && <Panel />`
  versus `count > 0 && <Panel />`, but leave off. Its own documentation describes
  false positives for already-boolean props. The registry's current
  `eslint-plugin-react` 7.37.5 declares ESLint peers only through 9 (`^9.7`), so
  installing it here would not satisfy ESLint 10 without ignoring peers. It is
  not installed. Although it has autofixes, those deliberately change leaked
  DOM output; they are not behavior-preserving cosmetic changes.
- **`unicorn/no-useless-undefined`:** leave off; do not add a plugin for this
  task. It can reject `let value = undefined` and allow `let value`, but genuine
  optional consumer inputs and undefined branches are not necessarily useless.
  Some suggestions can change whether an indexed access is evaluated. Registry
  version 79.0.0 declares ESLint >=10.4 and Node >=22: compatible with this
  session's ESLint 10.14/Node 24, but not core's entire advertised Node 20 range.
  It would require a new dependency and provides little value beyond review and
  existing built-ins for the cases found here. Do not enable its whole preset.

The package compatibility statements above were checked using `npm view`, not
by installing either third-party plugin. The existing-plugin syntax probes were
executed; third-party runtime compatibility was not claimed or tested.

### Autofix policy for these findings

Use automatic whitespace fixes or the simple boolean-coercion fix only on
reviewed changes. Manual review is necessary for mounting, lazy evaluation,
style omission versus an explicit value, hook enable/disable inputs, OR versus
nullish fallback, and copies before mutation. There is no safe context-free
fix for the central issue: whether absence denotes data or feature eligibility.
Those decisions belong in code review and targeted lifecycle/value regressions.

### Primary sources

- [ESLint no-unneeded-ternary](https://eslint.org/docs/latest/rules/no-unneeded-ternary)
- [ESLint no-nested-ternary](https://eslint.org/docs/latest/rules/no-nested-ternary)
- [ESLint no-useless-assignment](https://eslint.org/docs/latest/rules/no-useless-assignment)
- [ESLint no-unsafe-optional-chaining](https://eslint.org/docs/latest/rules/no-unsafe-optional-chaining)
- [ESLint AST selectors](https://eslint.org/docs/latest/extend/selectors)
- [ESLint no-restricted-syntax](https://eslint.org/docs/latest/rules/no-restricted-syntax)
- [typescript-eslint no-unnecessary-condition and indexed-access limitations](https://typescript-eslint.io/rules/no-unnecessary-condition/)
- [typescript-eslint prefer-nullish-coalescing](https://typescript-eslint.io/rules/prefer-nullish-coalescing/)
- [typescript-eslint strict-boolean-expressions](https://typescript-eslint.io/rules/strict-boolean-expressions/)
- [typescript-eslint supported dependency versions](https://typescript-eslint.io/users/dependency-versions/)
- [Stylistic multiline-ternary](https://eslint.style/rules/multiline-ternary)
- [React jsx-no-leaked-render](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/jsx-no-leaked-render.md)
- [Unicorn no-useless-undefined](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-useless-undefined.md)

## Validation results

Environment: Node 24.19.0, npm 11.9.0, Linux Chromium. No checks were disabled,
no tests skipped, no screenshot baselines updated, and no lint severities relaxed.

| Repository | Checks and actual results |
| --- | --- |
| core | Source/test TypeScript passed; ESLint passed with 0 errors and 40 pre-existing warnings; Stylelint passed. Jest 47/47 with coverage, browser scenarios 62/62, tooling/configuration tests 24/24. Production make/packaging passed and produced core 0.0.57. |
| editor | npm ci and npm ls --all passed; workspace/test TypeScript, ESLint (0 errors, 36 pre-existing warnings), and Stylelint passed. Full Vitest coverage run: 88/88 (67 unit, 7 component, 14 browser). Lint-configuration tests 13/13. Production editor, example-book and multipage fixture builds passed. Production runtime Chromium integration 1/1 passed. |

The editor was validated against the newly built core 0.0.57 archive, not its
previous installed core. The existing core:package workflow increments the patch
version and refreshes the editor manifest/lockfile. Registry dependency versions
and integrity values did not change, no npm publication occurred, and no lint
plugin was installed. Applying these branches together requires the sibling
core checkout and its generated local archive, as in the existing development
workflow.

Known existing observations: lint warnings (hook dependencies, file size and
explicit any in core; mostly file size in editor), production chunk-size/tooling
warnings, and fixture-media console errors during passing editor tests remain.
The production runtime test verifies the complete media fixture. There were no
screenshot comparison failures in this Linux run. Windows was not available and
was not claimed as tested. Generated core screenshot artifacts were restored;
reference images and screenshot assertions are unchanged.

AGENTS.md and eslint.config.js are byte-for-byte unchanged in both repositories.
Recommendations above remain proposals for a separate decision.
