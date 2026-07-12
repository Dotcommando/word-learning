# GENERAL_PLAN.md

## Task

Rebuild the Greek vocabulary study page from the unarchived Claude Design project in `example/` as a maintainable browser application written in semantic HTML, strict TypeScript, and plain CSS.

The result must reproduce the visual design and interactions while replacing all Claude Design runtime code with normal browser code.

The production build must output exactly one file:

```txt
dist/index.html
```

The file must contain the minified application JavaScript, minified CSS, and inline SVG icons.

## Sources Of Truth

Use these sources in this order:

1. This plan and `AGENTS.md` for behavior, architecture, storage, and build requirements.
2. The visible Claude Design result in `example/`.
3. The generated `.dc.html` and design-system CSS in `example/` for measurements, content, tokens, and states.
4. The screenshot/thumbnail in `example/` for final visual comparison.

Do not port or retain:

```txt
- `<x-dc>`;
- `<sc-if>`;
- `<sc-for>`;
- `DCLogic`;
- `support.js`;
- `_ds_bundle.js`;
- Claude Design templating syntax;
- generated runtime attributes that have no semantic value.
```

## Required User Experience

The finished page must include:

```txt
- title `Λέξεις`;
- the Russian subtitle from the reference;
- a centered responsive content container;
- a compact metadata row and icon toolbar;
- a load-word-set button;
- one show/hide-all-translations toggle whose icon and tooltip describe the action after click;
- one light/dark-theme toggle whose icon and tooltip describe the action after click;
- a five-column vocabulary table;
- column proportions `15 / 15 / 18 / 27 / 25`;
- hidden translations rendered as soft blurred masks;
- independent reveal/hide behavior for every word translation and example translation;
- an interactive first cell containing the Greek word and chevron;
- inline singular/plural declension details below the selected row;
- short italic case names: `именит.`, `родит.`, `винит.`, `зват.`;
- full translations inside an explicitly opened declension section;
- empty, loading, loaded, and visible error states;
- warm light and dark themes;
- keyboard focus, tooltips, hover, active, and disabled states;
- responsive widths matching the reference at approximately `760`, `920`, `1080`, and `1240` pixels.
```

Several word rows may be expanded at the same time.

## Persistence Requirements

Persist interface state in localStorage through a reusable store decorator:

```txt
- theme;
- global translation visibility;
- individually revealed word translations;
- individually revealed example translations;
- expanded word rows;
- active word-set id.
```

Persist imported word-set contents in IndexedDB.

Current scope includes automatically restoring the active imported set after reload. It does not include a UI for browsing or selecting all previously imported sets. The IndexedDB schema must nevertheless support that future feature.

## Import Format

Support one JSON word-set format in this phase.

Canonical shape:

```json
{
  "id": "optional-stable-id",
  "name": "Базовый набор",
  "words": [
    {
      "id": "optional-word-id",
      "word": "άνθρωπος",
      "transcription": "ánthropos",
      "translation": "человек",
      "example": "Ο άνθρωπος περιμένει στη στάση.",
      "exampleTranslation": "Человек ждёт на остановке.",
      "declensions": {
        "singular": [
          {
            "case": "nominative",
            "form": "ο άνθρωπος",
            "translation": "человек",
            "example": "Ο άνθρωπος περιμένει στη στάση.",
            "exampleTranslation": "Человек ждёт на остановке."
          }
        ],
        "plural": [
          {
            "case": "nominative",
            "form": "οι άνθρωποι",
            "translation": "люди",
            "example": "Οι άνθρωποι μιλούν δυνατά.",
            "exampleTranslation": "Люди говорят громко."
          }
        ]
      }
    }
  ]
}
```

Allowed case values:

```txt
nominative
genitive
accusative
vocative
```

Each singular and plural collection must contain one entry for every allowed case in the intended display order.

Generate ids during import when they are missing. Invalid input must not be partially saved.

## Non-Goals

Do not implement in this phase:

```txt
- a word-set library or picker;
- editing words or declensions;
- deleting or renaming stored sets;
- CSV import;
- export;
- authentication;
- remote APIs;
- grammar generation;
- spaced repetition;
- progress statistics;
- a JavaScript UI framework;
- a CSS framework.
```

## Definition Of Done For The Whole Task

The task is complete when:

```txt
- the screen closely reproduces the Claude Design reference;
- all required interactions work with mouse and keyboard;
- reload restores the active set and interface state;
- valid JSON imports are saved in IndexedDB;
- invalid JSON produces a visible useful error and saves nothing;
- source code follows the Flux and shortened-BEM contracts in `AGENTS.md`;
- all automated tests pass;
- the production build succeeds;
- `dist/` contains exactly one file named `index.html`;
- the final HTML has no dependency on files under `example/`;
- the task file contains completed checkboxes and a final verification record.
```

---

## Step 0 — Audit The Workspace And Freeze The Reference

**Status:** [ ]

### Goal

Understand the current repository, locate all Claude Design reference files under `example/`, and record the concrete visual and behavioral contracts before changing implementation files.

### Red

- The workspace structure and package tooling are unknown.
- The reference may contain generated behavior that must not be copied.
- There is no implementation baseline or verification record.

### Green

1. Inspect the repository root, existing package files, and any current source.
2. Locate the reference `.dc.html`, thumbnail, design-system CSS, and supporting files.
3. Record:
   - exact title and subtitle;
   - toolbar controls and icon states;
   - table labels and proportions;
   - container breakpoints;
   - light/dark token values;
   - sample rows and declension layout;
   - empty/loading behavior;
   - interactions that are demo-only and need real implementation.
4. Decide which existing files can be retained without violating the plan.
5. Add the audit notes to the progress log at the bottom of this file.

### Verify

- No implementation code is changed before the reference audit is recorded.
- The audit explicitly distinguishes visual reference code from production code.

### Definition Of Done

- [ ] Every relevant file under `example/` has been identified.
- [ ] The visual measurements and interaction rules are documented.
- [ ] Existing repository tooling has been assessed.
- [ ] The next three steps have been reassessed and remain executable.
- [ ] `GENERAL_PLAN.md` contains an audit entry.

---

## Step 1 — Create The Framework-Free Build And Test Skeleton

**Status:** [x]

### Goal

Create a minimal source/build structure for semantic HTML, TypeScript, CSS, unit tests, and a single-file production build.

### Red

- There is no guaranteed strict TypeScript build.
- There is no verified CSS/JS inlining pipeline.
- There is no test command.

### Green

1. Create or update the package manifest.
2. Configure strict TypeScript.
3. Configure a small bundler suitable for a single-page browser application.
4. Configure the production build so imported CSS and bundled JavaScript are inlined into `dist/index.html`.
5. Create the initial source tree described by `AGENTS.md`.
6. Add scripts equivalent to:
   - type checking;
   - unit tests;
   - production build;
   - all checks.
7. Create the smallest bootable page with no Claude Design runtime dependency.
8. Add a build assertion that fails unless `dist/` contains exactly `index.html`.

A suitable tool choice is Vite plus a single-file inlining plugin, Vitest, and jsdom. Use another small toolchain only when it satisfies the same contract more cleanly.

### Verify

- Run type checking.
- Run the empty test suite or a bootstrap smoke test.
- Run the production build.
- Inspect the generated HTML for inline `<style>` and inline executable script.
- Confirm no generated CSS or JS files remain in `dist/`.

### Definition Of Done

- [x] Strict TypeScript is enabled.
- [x] The app boots from separated source files.
- [x] `npm` scripts for typecheck, test, build, and check exist.
- [x] The build emits exactly `dist/index.html`.
- [x] The generated page does not load `support.js` or `_ds_bundle.js`.
- [x] A test or script enforces the one-file output contract.
- [x] The step is marked complete with commands and results recorded.

---

## Step 2 — Define The Word-Set Domain And Runtime Validation

**Status:** [ ]

### Goal

Introduce precise TypeScript contracts and validation for imported word-set JSON.

### Red

- Imported JSON is untrusted.
- The reference uses compact demo field names that are unsuitable as public data contracts.
- Invalid partial data could reach rendering or persistence.

### Green

1. Define relevant enums:
   - theme mode;
   - page phase;
   - Greek case;
   - grammatical number;
   - translation group or reveal target where useful.
2. Define `I`-prefixed interfaces for:
   - declension entry;
   - word;
   - word set;
   - persisted word-set record;
   - validation result and validation error.
3. Implement validation from `unknown` without `as`, `any`, or unsafe assertions.
4. Require all user-visible strings to be non-empty after trimming.
5. Require unique word ids after normalization/generation.
6. Require singular and plural declensions with the four supported cases in canonical order.
7. Normalize optional ids and generate missing ids outside the pure validator when appropriate.
8. Add a valid fixture based on the six reference words.
9. Add invalid fixtures covering:
   - malformed JSON;
   - missing name;
   - missing word fields;
   - unsupported case;
   - duplicate case;
   - missing declension number;
   - wrong primitive type.

### Verify

- Unit tests prove valid reference data is accepted.
- Unit tests prove every invalid fixture produces a useful field-oriented error.
- No invalid record is returned as a valid word set.

### Definition Of Done

- [ ] All closed string sets use enums.
- [ ] All object shapes use explicit interfaces.
- [ ] Validation accepts the canonical format.
- [ ] Validation rejects malformed or incomplete data.
- [ ] Error output is suitable for display to the user.
- [ ] No unsafe TypeScript escape hatch was introduced.
- [ ] Tests pass and the step record is updated.

---

## Step 3 — Implement The Flux Store Kernel

**Status:** [ ]

### Goal

Create a small typed Flux store with pure reducers, subscriptions, and deterministic state transitions.

### Red

- Interactive behavior has no single state source.
- Direct DOM mutation or storage calls could become scattered.
- Global and per-row visibility behavior can conflict without explicit reducer rules.

### Green

1. Define a generic store contract with:
   - `getState`;
   - `dispatch`;
   - `subscribe`.
2. Define the UI state:
   - theme;
   - phase;
   - active word-set id;
   - global translation visibility;
   - sets of individually revealed word translations;
   - sets of individually revealed example translations;
   - sets of expanded word ids;
   - current error message.
3. Define typed actions for:
   - bootstrap start/success/failure;
   - theme toggle;
   - global translations toggle;
   - individual word translation toggle;
   - individual example translation toggle;
   - declension toggle;
   - import start/success/failure;
   - invalid active-set clearing.
4. Implement a pure exhaustive reducer.
5. Define global toggle semantics:
   - when all translations are visible, clicking hides all;
   - otherwise clicking shows all;
   - the icon and tooltip always describe the next action.
6. Keep per-item state keyed by stable word ids, not row indexes.
7. Decide and test what happens to individual reveal state after a global action:
   - global show marks all current translations visible;
   - global hide clears all current reveal collections.

### Verify

- Reducer tests cover every action.
- Reducer tests cover mixed individual visibility followed by both global actions.
- Reducer tests cover multiple simultaneously expanded rows.
- Reducers do not use DOM, localStorage, IndexedDB, timers, or file APIs.

### Definition Of Done

- [ ] The generic store works and has deterministic tests.
- [ ] All UI transitions are represented as typed actions.
- [ ] Reducers are pure and exhaustive.
- [ ] Stable ids are used for row state.
- [ ] Global and individual reveal semantics are documented by tests.
- [ ] The step record includes test results.

---

## Step 4 — Add One-Expression localStorage Persistence

**Status:** [ ]

### Goal

Make selected stores persistable through one declaration expression while keeping storage concerns out of reducers and renderers.

### Red

- UI state is lost on reload.
- Direct storage access could spread through feature code.
- Corrupt or stale storage could break bootstrap.

### Green

1. Implement a persistence adapter contract.
2. Implement a localStorage adapter with:
   - storage key;
   - schema version;
   - serialize;
   - parse;
   - validate;
   - merge with defaults;
   - failure fallback.
3. Implement `withPersistence(...)` or an equivalent store decorator.
4. Declare the UI store as one expression that wraps the normal store with localStorage persistence.
5. Persist only:
   - theme;
   - global translation visibility;
   - individual reveal ids;
   - expanded word ids;
   - active word-set id.
6. Do not persist transient loading or error phases.
7. Handle:
   - missing storage;
   - malformed JSON;
   - old version;
   - unavailable/quota-throwing localStorage.
8. Keep the page usable and reset to defaults after a persistence failure.

### Verify

- Tests hydrate valid persisted state.
- Tests ignore malformed and incompatible state.
- Tests confirm dispatch writes updated persistent state.
- Tests confirm storage exceptions do not prevent store use.
- Search source files to confirm reducers and renderers do not access localStorage.

### Definition Of Done

- [ ] Store persistence is enabled through one declaration expression.
- [ ] Persisted data is versioned and validated.
- [ ] Transient state is excluded.
- [ ] Storage failure is non-fatal.
- [ ] All persistence tests pass.
- [ ] The exact declaration expression is recorded in the progress log.

---

## Step 5 — Implement The IndexedDB Word-Set Repository

**Status:** [ ]

### Goal

Persist imported word sets in IndexedDB behind a focused repository.

### Red

- Imported sets do not survive reload.
- Direct IndexedDB calls could leak into UI code.
- Schema decisions are not ready for a future set picker.

### Green

1. Define constants for:
   - database name;
   - database version;
   - object-store name.
2. Define a repository interface with at least:
   - `save`;
   - `getById`.
3. Store records with:
   - stable id;
   - name;
   - validated words;
   - created timestamp;
   - updated timestamp;
   - schema version.
4. Generate ids with a browser-safe stable mechanism when omitted.
5. Implement database opening and upgrade creation.
6. Make transaction failures explicit typed failures.
7. Add a test database strategy using a browser test environment or an IndexedDB test implementation.
8. Do not add list/delete/rename UI. Repository methods beyond current use are optional only when they remove real future migration cost.

### Verify

- Tests save and load a complete reference set.
- Tests return no record for a missing id.
- Tests prove a failed write does not report success.
- No reducer or renderer imports the IndexedDB implementation directly.

### Definition Of Done

- [ ] IndexedDB schema and version are explicit.
- [ ] Valid word sets round-trip without data loss.
- [ ] Missing ids are handled predictably.
- [ ] Errors are surfaced to effects.
- [ ] Tests pass.
- [ ] Future picker support does not require changing stored record shape.

---

## Step 6 — Implement Bootstrap And Active-Set Restoration

**Status:** [ ]

### Goal

Connect the persisted UI state and IndexedDB repository during application startup.

### Red

- An active id may exist without a matching IndexedDB record.
- Rendering may start before storage restoration is complete.
- Startup errors have no visible state.

### Green

1. Bootstrap the UI store and repository.
2. Start in a loading phase while resolving the active word set.
3. When there is no active id, enter the empty state.
4. When the active record exists:
   - load it;
   - enter loaded state;
   - reconcile reveal and expanded ids against current word ids.
5. When the active record does not exist:
   - clear the invalid active id;
   - remove stale per-word UI ids;
   - enter the empty state.
6. When IndexedDB fails:
   - enter a visible error state;
   - keep the upload action available when possible.
7. Keep bootstrap orchestration in an effect/service, not a reducer.

### Verify

- Tests cover no active id, valid active id, missing record, and repository failure.
- Tests prove stale row ids are removed during reconciliation.

### Definition Of Done

- [ ] Reload can restore the active imported set.
- [ ] Missing records degrade safely to empty state.
- [ ] Startup failures are visible and non-destructive.
- [ ] Reconciliation uses stable word ids.
- [ ] Bootstrap tests pass.

---

## Step 7 — Rebuild The Static Screen And Theme Tokens

**Status:** [ ]

### Goal

Recreate the visual shell from the Claude Design reference with semantic HTML and shortened-BEM CSS.

### Red

- The bootable skeleton does not reproduce the reference.
- Theme tokens and responsive dimensions are not established.
- CSS naming may drift from the requested convention.

### Green

1. Create the application shell:
   - title;
   - subtitle;
   - metadata line;
   - toolbar;
   - content state region.
2. Recreate light-theme tokens from the reference.
3. Recreate the warm dark-theme overrides.
4. Implement container widths:
   - up to about `760px`;
   - `920px` from `992px`;
   - `1080px` from `1200px`;
   - `1240px` from `1440px`.
5. Implement shortened-BEM classes exactly as specified in `AGENTS.md`.
6. Implement local inline SVG icons for:
   - upload;
   - eye;
   - eye-off;
   - moon;
   - sun;
   - chevron;
   - empty-state book.
7. Recreate typography, border, shadow, spacing, and transition character.
8. Do not copy generic design-system CSS that the screen does not use.
9. Preserve a local fallback when reference web fonts are unavailable.

### Verify

- Inspect the page at the four target widths.
- Compare title, subtitle, toolbar, outer spacing, border radii, and palette with `example/`.
- Confirm all icon markup is local.
- Confirm CSS selectors follow the shortened-BEM convention.

### Definition Of Done

- [ ] The static shell closely matches the reference.
- [ ] Both themes have warm palettes.
- [ ] All four responsive container widths are implemented.
- [ ] All required icons are inline SVG.
- [ ] No Claude Design runtime classes or custom elements remain.
- [ ] CSS naming passes a manual convention audit.

---

## Step 8 — Render The Vocabulary Table And Translation Masks

**Status:** [ ]

### Goal

Render loaded word-set data and implement independent and global translation reveal behavior.

### Red

- The table is not data-driven.
- Hidden translations may be empty, inaccessible, or visually unlike the reference.
- Mixed global/per-cell state is not connected to the DOM.

### Green

1. Render the five headers:
   - Слово;
   - Транскрипция;
   - Перевод;
   - Пример;
   - Перевод примера.
2. Use the exact grid proportions `15 / 15 / 18 / 27 / 25`.
3. Render every imported word from state.
4. Render translation and example-translation cells as real buttons.
5. In hidden state:
   - preserve the real text in the button;
   - visually blur it;
   - prevent accidental text selection;
   - expose a clear accessible label describing the reveal action.
6. In revealed state:
   - remove blur;
   - allow text selection;
   - expose a label describing the hide action.
7. Dispatch per-cell toggle actions by stable word id.
8. Connect the toolbar eye toggle to global visibility state.
9. Ensure the eye/eye-off icon and tooltip describe the next action.
10. Disable the global control when there is no loaded set.
11. Keep imported content safe by assigning text, not injecting HTML.

### Verify

- Test keyboard and pointer toggling for both translation columns.
- Test mixed states in one and multiple rows.
- Test global show after a mixed state.
- Test global hide after all-visible state.
- Compare blur amount, hover effect, cell spacing, wrapping, and row separators with the reference.

### Definition Of Done

- [ ] The table is fully data-driven.
- [ ] Every translation cell toggles independently.
- [ ] The global toggle has correct next-action semantics.
- [ ] Hidden translations use the soft blurred-mask design.
- [ ] Text wrapping and column ratios match the reference.
- [ ] Imported strings cannot create markup.
- [ ] Unit or DOM tests cover the critical behavior.

---

## Step 9 — Implement Inline Declension Expansion

**Status:** [ ]

### Goal

Implement the interactive word cell and inline singular/plural declension section.

### Red

- Word details are absent or would require a modal.
- The first cell and chevron have no accessible expansion state.
- Case layout and visibility rules are not represented.

### Green

1. Make the entire first cell a real button.
2. Include:
   - Greek word;
   - right-aligned chevron.
3. Clicking the word, blank area of the cell, or chevron must dispatch the same action.
4. Add current-action tooltip:
   - `Показать склонение`;
   - `Скрыть склонение`.
5. Set `aria-expanded` and connect the button to the detail region.
6. Rotate the chevron when expanded.
7. Insert the detail region directly after its word row, not in a modal.
8. Permit several rows to remain expanded.
9. Render two groups:
   - `Единственное число`;
   - `Множественное число`.
10. Render each case with:
    - small italic Russian abbreviation;
    - prominent Greek form;
    - Russian gloss;
    - Greek example;
    - Russian example translation.
11. Always show translations inside an opened declension region regardless of global mask state.
12. Use the reference one-column details layout below the tablet breakpoint and two columns on wider screens.
13. Respect reduced-motion preferences.

### Verify

- Test pointer and keyboard expansion.
- Test multiple open rows.
- Test chevron and tooltip updates.
- Test that global translation visibility does not hide detail translations.
- Compare detail padding, accent rule, headings, case typography, and responsive grid with the reference.

### Definition Of Done

- [ ] The entire word cell toggles expansion.
- [ ] Chevron direction and tooltip are correct.
- [ ] Details appear inline below the matching row.
- [ ] Multiple rows can remain open.
- [ ] All eight case records render in canonical order.
- [ ] Detail translations are always visible.
- [ ] Accessibility attributes and tests are present.

---

## Step 10 — Implement Real JSON Import And IndexedDB Save

**Status:** [ ]

### Goal

Replace the reference's simulated upload with a real file-selection, validation, persistence, and activation flow.

### Red

- The upload button only simulates loading in the reference.
- No file input or JSON parsing exists.
- Invalid imports could overwrite the active set.

### Green

1. Add an accessible hidden JSON file input controlled by both upload buttons.
2. Accept JSON files.
3. On selection:
   - dispatch import start;
   - read the file;
   - parse JSON;
   - validate canonical shape;
   - normalize/generate ids;
   - save one complete record to IndexedDB;
   - dispatch import success with the new active id and set.
4. On success:
   - make the new set active;
   - update metadata with set name and word count;
   - default translations to hidden for the imported set;
   - clear stale reveal/expanded ids;
   - render loaded state.
5. On failure:
   - save nothing;
   - preserve the previous active set when one exists;
   - show a useful visible error;
   - allow retry;
   - reset the input value so selecting the same file again works.
6. Prevent race conditions from rapid repeated imports by defining the accepted latest-operation behavior.
7. Do not add a previously imported set picker.

### Verify

- Import the valid reference fixture through the browser UI.
- Reload and confirm it restores from IndexedDB.
- Import malformed and invalid fixtures and confirm no partial record is saved.
- Confirm a failed replacement import leaves the previous active set usable.
- Confirm same-file retry works.

### Definition Of Done

- [ ] Both upload entry points open the native file picker.
- [ ] Valid files are validated and persisted.
- [ ] Invalid files show useful errors and save nothing.
- [ ] The previous set survives a failed import.
- [ ] Successful import resets per-word UI state safely.
- [ ] Reload restores the new active set.
- [ ] Automated coverage exists for success and failure paths.

---

## Step 11 — Complete Page States, Tooltips, And Accessibility

**Status:** [ ]

### Goal

Finish empty, loading, loaded, and error states and make every interaction usable without a mouse.

### Red

- State transitions may be visually incomplete.
- CSS-only tooltips can be clipped or inaccessible.
- Focus movement and labels may be inconsistent after rerender.

### Green

1. Recreate the empty state:
   - inline book icon;
   - reference text;
   - visible load button.
2. Recreate the loading state with the restrained animated indicator.
3. Create an error state consistent with the same warm visual language.
4. Keep the primary recovery action available.
5. Implement tooltips for all icon controls and the interactive word cell.
6. Ensure current `aria-label` values match current next actions.
7. Ensure tooltip content is available on hover and keyboard focus.
8. Ensure all controls have visible `:focus-visible` styling.
9. Preserve or restore sensible focus after rerender.
10. Check tab order and Enter/Space behavior.
11. Add accessible status announcements for loading, success, and error changes without excessive verbosity.
12. Respect `prefers-reduced-motion`.

### Verify

- Navigate the entire application with keyboard only.
- Test with translations hidden, revealed, and mixed.
- Test tooltips near viewport edges and inside the horizontally scrollable table.
- Run an accessibility audit available in the workspace.
- Confirm state changes are announced appropriately.

### Definition Of Done

- [ ] All four page phases have finished visuals.
- [ ] Every interactive control is keyboard-operable.
- [ ] Tooltips and labels describe the next action.
- [ ] Focus is visible and stable.
- [ ] Reduced-motion behavior is implemented.
- [ ] No state is communicated only by color.
- [ ] Accessibility verification results are recorded.

---

## Step 12 — Responsive And Visual Fidelity Pass

**Status:** [ ]

### Goal

Bring the implementation into close visual agreement with the Claude Design screen across target sizes and both themes.

### Red

- Functional implementation may have accumulated spacing, typography, or responsive drift.
- The table may become unreadable on narrow screens.
- Details may not align with the reference.

### Green

1. Compare side by side with `example/` at:
   - a large desktop width using the `1240px` container;
   - a normal desktop width using the `1080px` container;
   - a small desktop/tablet-landscape width using the `920px` container;
   - a narrow tablet width using the `760px` maximum container.
2. Verify:
   - title block;
   - metadata position;
   - toolbar button dimensions;
   - table border and rounding;
   - header typography;
   - row density;
   - blur mask dimensions;
   - declension layout;
   - light/dark contrast;
   - horizontal scroll behavior below the usable table width.
3. Preserve a table minimum width close to the reference rather than crushing columns.
4. Fix only measurable discrepancies.
5. Capture comparison screenshots when browser tooling is available.

### Verify

- Run visual checks in both themes.
- Verify no horizontal page overflow; only the table scroller may scroll horizontally.
- Verify text remains legible at zoomed browser settings.
- Confirm no content is clipped by tooltips or rounded containers.

### Definition Of Done

- [ ] All four target width ranges are verified.
- [ ] Both themes are verified.
- [ ] The table remains readable on narrow screens.
- [ ] Declension regions adapt from two columns to one.
- [ ] Visual discrepancies have been recorded and resolved.
- [ ] Comparison screenshots or equivalent evidence are referenced in the progress log.

---

## Step 13 — Finalize The Single-File Production Build

**Status:** [ ]

### Goal

Guarantee that the distributable is one minified HTML file containing the application code, styles, and icons.

### Red

- Development output may still reference source files or emit assets.
- Inline CSS or JS may be unminified.
- Reference or development-only code may remain.

### Green

1. Run production type checking and tests.
2. Build production output.
3. Assert that `dist/` contains exactly:
   - `index.html`.
4. Inspect the file and confirm:
   - application CSS is in an inline `<style>`;
   - application JavaScript is in an inline `<script>`;
   - SVG icons are inline;
   - no local CSS, JS, or icon asset paths exist;
   - no `example/` path exists;
   - no Claude Design custom elements or runtime identifiers exist.
5. Confirm CSS and JavaScript are minified.
6. Open `dist/index.html` directly and test core interactions.
7. Test the file through a simple local static server as a second smoke test.
8. Record output file size without introducing arbitrary size optimization that harms clarity or accessibility.

### Verify

Run and record commands equivalent to:

```txt
npm run check
npm run build
find dist -type f
```

Also inspect the final document for forbidden runtime references.

### Definition Of Done

- [ ] All checks pass.
- [ ] `dist/index.html` is the only output file.
- [ ] CSS, JavaScript, and SVG icons are inline.
- [ ] CSS and JavaScript are minified.
- [ ] The file works when opened directly.
- [ ] The file works from a local static server.
- [ ] No reference-runtime dependency remains.

---

## Step 14 — Final Review And Handoff

**Status:** [ ]

### Goal

Leave the repository in a finished, understandable, and verifiable state.

### Red

- The implementation may be complete while documentation or task progress is stale.
- Future work boundaries may be unclear.
- There may be untracked generated or temporary files.

### Green

1. Review all changes for scope compliance.
2. Remove temporary files and accidental copied reference assets.
3. Confirm `example/` was not modified.
4. Update this plan:
   - mark every completed step;
   - include final commands and results;
   - list known limitations;
   - list deferred non-goals.
5. Update `AGENTS.md` only if implementation established a durable rule not already covered.
6. Prepare a concise handoff containing:
   - implemented behavior;
   - storage design;
   - build result;
   - tests run;
   - final output location;
   - any unresolved issue.

### Verify

- Check git diff for unrelated edits.
- Run the complete check and build one final time.
- Confirm the plan and actual repository state agree.

### Definition Of Done

- [ ] Every completed step is checked.
- [ ] Final verification commands and results are recorded.
- [ ] No temporary artifacts remain.
- [ ] `example/` is unchanged.
- [ ] Known limitations are explicit.
- [ ] The repository is ready for the next planned feature.

---

## Progress Log

Codex must append dated entries here after each completed step.

Use this format:

```txt
### YYYY-MM-DD — Step N

Implemented:
- ...

Verified:
- `command`
- result

Plan changes:
- ...
```

### 2026-07-12 — Step 1

Implemented:
- Added strict TypeScript configuration for browser source, tests, and local config files.
- Added Vite with `vite-plugin-singlefile`, Vitest with jsdom, and exact package versions in `package.json`/`package-lock.json`.
- Added scripts for `typecheck`, `lint`, `test`, `build`, and `check`.
- Created the initial framework-free source tree under `src/` with separated HTML, TypeScript, and CSS.
- Added a minimal bootable `Λέξεις` page without Claude Design runtime dependencies.
- Added a Vitest bootstrap smoke test.
- Added `scripts/assert-single-file-build.mjs` to fail builds unless `dist/` contains exactly `index.html` with inline CSS and JavaScript and no `example/`, `support.js`, or `_ds_bundle.js` references.

Verified:
- `npm run typecheck`
- passed
- `npm run lint`
- passed
- `npm run test`
- 1 test file passed, 1 test passed
- `npm run build`
- passed and emitted `dist/index.html`
- `npm run check`
- passed
- `find dist -maxdepth 1 -type f`
- returned only `dist/index.html`
- inline inspection confirmed inline `<style>`, inline executable `<script>`, no external CSS/JS references, and no Claude Design runtime references.

Plan changes:
- Reassessed Steps 2, 3, and 4; they remain executable against the new strict TypeScript, Vitest/jsdom, and framework-free source skeleton.
- No architecture or scope contract changed.
