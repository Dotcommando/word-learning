# AGENTS.md

## Active Task Workflow

Work through the top-level `GENERAL_PLAN.md` file.

The active task file is the source of truth for the current implementation phase. It must contain the task description, scope, ordered steps, Red/Green/Verify notes, Definition of Done, and progress.

Before starting a step:

```txt
- confirm that the step is clear, small enough, and testable;
- inspect the relevant workspace files and the matching reference files in `example/`;
- split or clarify the step before implementation when it is too large or ambiguous;
- ask the user only when the ambiguity cannot be resolved from the workspace, `GENERAL_PLAN.md`, or this file.
```

After completing a step:

```txt
- mark the step complete in `GENERAL_PLAN.md`;
- record what changed and how it was verified;
- reassess the next three steps;
- update upcoming steps when contracts, assumptions, or scope changed;
- check whether a durable rule belongs in this file.
```

Do not let `GENERAL_PLAN.md` become stale.

## Project Scope

This is a browser-only application for studying Greek words.

The implementation uses:

```txt
- semantic HTML;
- strict TypeScript;
- plain CSS;
- a small framework-free Flux architecture;
- localStorage for persisted interface state;
- IndexedDB for imported word sets;
- a build that produces exactly one distributable HTML file.
```

Do not introduce React, Vue, Angular, Svelte, jQuery, a CSS framework, or a component runtime unless the user explicitly changes the scope.

The unarchived Claude Design project in `example/` is a visual and behavioral reference only. Do not ship or depend on its custom elements, `support.js`, design-system runtime, template syntax, or generated component logic. Reimplement the screen with normal HTML, TypeScript, and CSS.

## Visual Reference Contract

Reproduce the finished Claude Design screen, including:

```txt
- the warm editorial visual direction;
- light and dark themes;
- the centered responsive container;
- the five-column word table;
- blurred translation masks;
- per-cell translation reveal;
- the global show/hide translations toggle;
- inline declension expansion;
- empty, loading, loaded, and error states;
- icon tooltips, hover, active, disabled, and keyboard-focus states.
```

When the reference code and the screenshot disagree, prefer the visible result. Preserve behavior described in `GENERAL_PLAN.md` even when the reference contains demo-only behavior.

## Flux Architecture

Use unidirectional data flow:

```txt
DOM event
  -> typed action
  -> dispatcher/store
  -> pure reducer
  -> new state
  -> subscribed renderer
```

Rules:

- Store state is the only source of truth for interactive UI state.
- Reducers must be pure and must not access the DOM, storage APIs, files, timers, or IndexedDB.
- Renderers read state and update the DOM. They must not contain business decisions that belong in reducers.
- Asynchronous work belongs in typed effects or services. Effects may dispatch start, success, and failure actions.
- Use narrow feature ownership. Do not create a generic abstraction until at least two real callers need it.
- Prefer one small UI store and focused services over many stores with unclear ownership.
- Use event delegation where it reduces listener duplication without harming readability.
- Use `data-*` attributes for TypeScript DOM hooks. Do not couple behavior to presentation class names.

A suitable source layout is:

```txt
src/
  index.html
  main.ts
  styles/
    index.css
  app/
    bootstrap.ts
  state/
    store.ts
    persistence.ts
  features/
    ui-state/
    word-sets/
  persistence/
    indexed-db.ts
  ui/
    render-app.ts
    templates.ts
    dom.ts
  icons/
    icons.ts
```

Adjust this layout only when the resulting ownership is clearer.

## Store Persistence

Persistence must be opt-in and composable. A store must become localStorage-backed through one declaration expression, for example:

```typescript
export const uiStore = withPersistence(createStore(INITIAL_UI_STATE, uiReducer), localStoragePersistence(UI_STATE_STORAGE_KEY, UI_STATE_VERSION));
```

The exact names may change, but the one-expression usage and separation of concerns must remain.

Rules:

- The persistence decorator subscribes to store updates and restores validated state during creation.
- Storage failures must not make the application unusable.
- Stored data must have a schema version.
- Hydrated data must be validated and merged with current defaults.
- Reducers and renderers must not call `localStorage` directly.
- Persist only interface state: theme, global translation visibility, individually revealed cells, expanded word rows, and active word-set id.
- Store imported word-set contents in IndexedDB, not localStorage.

## IndexedDB

Access IndexedDB through a focused repository/service.

Rules:

- UI code and reducers must not call IndexedDB directly.
- Use an explicit database name, version, and object-store name.
- Store complete validated word-set records.
- Generate stable ids for imported sets when the file does not provide one.
- Keep the schema suitable for a future word-set picker, but do not implement that picker unless it is added to the plan.
- On startup, restore the active word set by the id persisted in UI state.
- A missing or deleted active record must degrade to the empty state and clear the invalid active id.
- IndexedDB errors must produce a visible non-destructive error state.

## Constants And Enums

When a field has a closed set of string values, define an enum instead of an inline string-literal union.

Use project-relevant enums, for example:

```typescript
export enum THEME_MODE {
  LIGHT = 'light',
  DARK = 'dark',
}

export const THEME_MODE_ARRAY = Object.values(THEME_MODE);

export enum GREEK_CASE {
  NOMINATIVE = 'nominative',
  GENITIVE = 'genitive',
  ACCUSATIVE = 'accusative',
  VOCATIVE = 'vocative',
}

export const GREEK_CASE_ARRAY = Object.values(GREEK_CASE);

export enum GRAMMATICAL_NUMBER {
  SINGULAR = 'singular',
  PLURAL = 'plural',
}

export const GRAMMATICAL_NUMBER_ARRAY = Object.values(GRAMMATICAL_NUMBER);
```

Constants and enums belong to the narrowest module that owns their meaning. Do not create unrelated global collections.

## TypeScript Rules

Enable strict TypeScript settings.

Use the repository's existing patterns and the narrowest reasonable module ownership. Avoid unrelated refactors.

Method and function names must describe what they do, not the workflow in which they happen.

Use structured browser APIs and parsers instead of ad hoc string manipulation when reasonable.

New code must not use:

```txt
- `as`;
- `any`;
- the `object` type;
- double assertions;
- non-null assertions used to silence incorrect DOM assumptions.
```

Prefer:

```txt
- precise narrowing;
- discriminated unions;
- enums;
- generics;
- explicit interfaces;
- reusable DOM type guards;
- exhaustive reducer handling.
```

Prefer interfaces over type aliases for object shapes. Prefix newly introduced internal object-shape interfaces with `I`.

Do not rename existing public contracts without an explicit task.

When building objects with optional properties, prefer conditional object spread over repeatedly mutating an initially empty object. Preserve valid falsy values.

Prefer concise returns and ternaries when they improve readability.

Do not add comments that merely restate the code. Keep comments only when they explain a non-obvious constraint or compatibility decision.

Do not remove user-written comments.

## HTML And DOM Rules

Use semantic native elements first.

Rules:

- Buttons must be real `<button>` elements.
- The file picker must be a real `<input type="file">`, visually hidden only when an accessible button controls it.
- Every icon-only button requires an up-to-date `aria-label` and tooltip.
- Expanded word controls require `aria-expanded` and a relationship to the expanded region.
- Translation masks must be keyboard-operable buttons.
- Preserve sensible focus after imports and state changes.
- Do not recreate native controls with generic `<div>` elements.
- Avoid `innerHTML` for untrusted imported content. Build text nodes or set `textContent`.
- Imported JSON is untrusted input and must be validated before rendering or persistence.

## CSS Rules

Use the shortened BEM convention requested for this project.

Examples:

```css
.search {}
._search-button {}
._search-button__align-right {}
```

Rules:

- A block uses a normal semantic class such as `.toolbar`, `.word-table`, or `.declension`.
- An element uses the underscore-prefixed form such as `._toolbar-button` or `._word-table-cell`.
- An element modifier extends that element class with a double underscore, such as `._toolbar-button__primary` or `._word-table-cell__interactive`.
- Do not use standard BEM forms such as `.toolbar__button` or `.toolbar__button--primary`.
- Do not use presentation classes as JavaScript selectors; use `data-*`.
- Keep selectors shallow and avoid dependence on DOM depth.
- Use CSS custom properties for palette, typography, spacing, borders, radii, shadows, transitions, and responsive widths.
- Keep light-theme tokens on the root application block and override theme tokens through an explicit dark-theme modifier.
- Do not add inline style attributes for ordinary styling.
- Preserve the reference column proportions: `15 / 15 / 18 / 27 / 25`.
- Preserve the reference container breakpoints and approximate widths: `760`, `920`, `1080`, and `1240` pixels.
- Keep focus styles visible and do not communicate state through color alone.
- Respect `prefers-reduced-motion`.

## Icons

Keep icons as local inline SVG definitions or SVG template functions.

Rules:

- Do not use an icon CDN or runtime icon library.
- Do not load icon files at runtime.
- Use `currentColor`, consistent view boxes, stroke widths, line caps, and line joins.
- The production build must inline all icon markup into the single HTML output.

## Word-Set Import Contract

The current import format is JSON.

A word set contains:

```txt
- optional id;
- name;
- words.
```

Each word contains:

```txt
- optional id;
- Greek word;
- transcription;
- translation;
- Greek example;
- example translation;
- singular declension entries;
- plural declension entries.
```

Each declension entry contains:

```txt
- Greek case enum value;
- Greek form;
- Russian translation or gloss;
- Greek example;
- Russian example translation.
```

Validation must report a useful user-facing error without partially saving invalid data.

Do not add CSV, editing, exporting, remote loading, authentication, or a previously imported set picker until they are explicitly planned.

## Build Contract

The source remains separated into HTML, TypeScript, and CSS.

The production build must:

```txt
- type-check TypeScript;
- transpile, bundle, and minify JavaScript;
- minify CSS;
- inline JavaScript into the HTML;
- inline CSS into the HTML;
- inline SVG icons;
- produce exactly `dist/index.html` and no other distributable files.
```

Do not depend on the Claude Design runtime in production.

Do not add runtime network dependencies for application logic or icons. External font links may remain only when they are intentionally retained from the visual reference and the page has a suitable local fallback.

## Testing And Verification

Add tests at the layer that owns the behavior.

At minimum, cover:

```txt
- reducers and global translation toggling;
- individual translation visibility;
- expanded declension rows;
- localStorage hydration, versioning, and failure fallback;
- JSON validation;
- IndexedDB save/load behavior;
- bootstrap restoration of the active set;
- empty, loading, loaded, and error rendering;
- production single-file build output.
```

Use browser-level tests for the critical user flow when the workspace supports them.

Visual verification must compare the implementation with the reference in `example/` at the four target container ranges and in both themes.

## Repository Hygiene

Do not modify files under `example/`; they are reference material.

Do not make cosmetic edits unrelated to the active step.

Do not list unchanged files in implementation summaries.

Default to ASCII unless non-ASCII is required. Greek and Russian content are explicitly required.

Do not use destructive git commands unless the user explicitly requests them.
