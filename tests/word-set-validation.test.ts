import { describe, expect, it } from 'vitest';

import {
  GREEK_CASE,
  parseWordSetJson,
  validateWordSetInput,
} from '../src/features/word-sets/word-sets';
import { referenceWordSetInput } from './fixtures/reference-word-set';

interface IFixtureDeclensionEntry {
  case: string;
  form: string;
  translation: string;
  example: string;
  exampleTranslation: string;
}

interface IFixtureDeclensions {
  singular?: IFixtureDeclensionEntry[];
  plural?: IFixtureDeclensionEntry[];
}

interface IFixtureWord {
  id?: string;
  word?: unknown;
  transcription?: unknown;
  translation?: unknown;
  example?: unknown;
  exampleTranslation?: unknown;
  declensions?: IFixtureDeclensions;
}

interface IFixtureWordSet {
  id?: string;
  name?: unknown;
  words?: IFixtureWord[];
}

describe('word-set validation', () => {
  it('accepts the six-word reference fixture', () => {
    const result = validateWordSetInput(referenceWordSetInput);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.wordSet.id).toBe('reference-greek-words');
      expect(result.wordSet.name).toBe('Базовый набор');
      expect(result.wordSet.words).toHaveLength(6);
      expect(result.wordSet.words[0]?.word).toBe('άνθρωπος');
      expect(result.wordSet.words[0]?.declensions.singular.map((entry) => entry.case)).toEqual([
        GREEK_CASE.NOMINATIVE,
        GREEK_CASE.GENITIVE,
        GREEK_CASE.ACCUSATIVE,
        GREEK_CASE.VOCATIVE,
      ]);
    }
  });

  it('generates stable ids when ids are missing', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        createValidWordInput(),
      ],
    }));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.wordSet.id).toBe('word-set-δοκιμή');
      expect(result.wordSet.words[0]?.id).toBe('word-λόγος-1');
    }
  });

  it('rejects malformed JSON with a root-level error', () => {
    const result = parseWordSetJson('{not valid json');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.errors).toContainEqual({
        path: '$',
        message: 'Файл должен содержать корректный JSON.',
      });
    }
  });

  it('rejects a missing name with a field-oriented error', () => {
    const result = validateWordSetInput({
      words: [
        createValidWordInput(),
      ],
    });

    expectFailurePath(result, '$.name');
  });

  it('rejects missing word fields with a field-oriented error', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        {
          transcription: 'lógos',
          translation: 'слово',
          example: 'Ο λόγος είναι σαφής.',
          exampleTranslation: 'Слово ясно.',
          declensions: createValidDeclensions(),
        },
      ],
    }));

    expectFailurePath(result, '$.words[0].word');
  });

  it('rejects unsupported case values', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        createValidWordInput({
          declensions: {
            singular: [
              createDeclensionEntry('dative'),
              createDeclensionEntry(GREEK_CASE.GENITIVE),
              createDeclensionEntry(GREEK_CASE.ACCUSATIVE),
              createDeclensionEntry(GREEK_CASE.VOCATIVE),
            ],
            plural: createValidDeclensionCollection(),
          },
        }),
      ],
    }));

    expectFailurePath(result, '$.words[0].declensions.singular[0].case');
  });

  it('rejects duplicate cases', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        createValidWordInput({
          declensions: {
            singular: [
              createDeclensionEntry(GREEK_CASE.NOMINATIVE),
              createDeclensionEntry(GREEK_CASE.NOMINATIVE),
              createDeclensionEntry(GREEK_CASE.ACCUSATIVE),
              createDeclensionEntry(GREEK_CASE.VOCATIVE),
            ],
            plural: createValidDeclensionCollection(),
          },
        }),
      ],
    }));

    expectFailurePath(result, '$.words[0].declensions.singular[1].case');
  });

  it('rejects a missing declension number', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        createValidWordInput({
          declensions: {
            singular: createValidDeclensionCollection(),
          },
        }),
      ],
    }));

    expectFailurePath(result, '$.words[0].declensions.plural');
  });

  it('rejects wrong primitive types', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      name: 42,
    }));

    expectFailurePath(result, '$.name');
  });

  it('rejects duplicate word ids after normalization', () => {
    const result = validateWordSetInput(createValidWordSetInput({
      words: [
        createValidWordInput({
          id: 'same-id',
        }),
        createValidWordInput({
          id: 'same-id',
        }),
      ],
    }));

    expectFailurePath(result, '$.words[1].id');
  });
});

function expectFailurePath(result: ReturnType<typeof validateWordSetInput>, path: string): void {
  expect(result.ok).toBe(false);

  if (!result.ok) {
    expect(result.errors.some((error) => error.path === path)).toBe(true);
    expect(result.errors.every((error) => error.message.length > 0)).toBe(true);
  }
}

function createValidWordSetInput(overrides: Partial<IFixtureWordSet> = {}): IFixtureWordSet {
  return {
    name: 'Δοκιμή',
    words: [
      createValidWordInput(),
    ],
    ...overrides,
  };
}

function createValidWordInput(overrides: Partial<IFixtureWord> = {}): IFixtureWord {
  return {
    word: 'λόγος',
    transcription: 'lógos',
    translation: 'слово',
    example: 'Ο λόγος είναι σαφής.',
    exampleTranslation: 'Слово ясно.',
    declensions: createValidDeclensions(),
    ...overrides,
  };
}

function createValidDeclensions(): IFixtureDeclensions {
  return {
    singular: createValidDeclensionCollection(),
    plural: createValidDeclensionCollection(),
  };
}

function createValidDeclensionCollection(): IFixtureDeclensionEntry[] {
  return [
    createDeclensionEntry(GREEK_CASE.NOMINATIVE),
    createDeclensionEntry(GREEK_CASE.GENITIVE),
    createDeclensionEntry(GREEK_CASE.ACCUSATIVE),
    createDeclensionEntry(GREEK_CASE.VOCATIVE),
  ];
}

function createDeclensionEntry(caseName: string): IFixtureDeclensionEntry {
  return {
    case: caseName,
    form: `form ${caseName}`,
    translation: `translation ${caseName}`,
    example: `example ${caseName}`,
    exampleTranslation: `example translation ${caseName}`,
  };
}
