import {
  GRAMMATICAL_NUMBER,
  GREEK_CASE,
  GREEK_CASE_ARRAY,
  type IDeclensionEntry,
  type IDeclensions,
  type IValidationError,
  type IWord,
  type IWordSet,
  type WordSetValidationResult,
} from './domain';

interface IDeclensionEntryDraft {
  case: GREEK_CASE;
  form: string;
  translation: string;
  example: string;
  exampleTranslation: string;
}

interface IDeclensionsDraft {
  singular: IDeclensionEntryDraft[];
  plural: IDeclensionEntryDraft[];
}

interface IWordDraft {
  id?: string;
  word: string;
  transcription: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  declensions: IDeclensionsDraft;
}

interface IWordSetDraft {
  id?: string;
  name: string;
  words: IWordDraft[];
}

export function parseWordSetJson(json: string): WordSetValidationResult {
  try {
    const parsed: unknown = JSON.parse(json);

    return validateWordSetInput(parsed);
  } catch {
    return {
      ok: false,
      errors: [
        {
          path: '$',
          message: 'Файл должен содержать корректный JSON.',
        },
      ],
    };
  }
}

export function validateWordSetInput(input: unknown): WordSetValidationResult {
  const draftResult = validateWordSetDraft(input);

  if (!draftResult.ok) {
    return draftResult;
  }

  const wordSet = normalizeWordSetIds(draftResult.wordSet);
  const duplicateErrors = collectDuplicateWordIdErrors(wordSet);

  return duplicateErrors.length > 0
    ? {
      ok: false,
      errors: duplicateErrors,
    }
    : {
      ok: true,
      wordSet,
    };
}

function validateWordSetDraft(input: unknown): WordSetDraftValidationResult {
  const errors: IValidationError[] = [];

  if (!isStructuredValue(input)) {
    return {
      ok: false,
      errors: [
        {
          path: '$',
          message: 'Набор слов должен быть объектом.',
        },
      ],
    };
  }

  const id = readOptionalTrimmedString(input, 'id', '$.id', errors);
  const name = readRequiredTrimmedString(input, 'name', '$.name', errors);
  const words = readWords(readProperty(input, 'words'), '$.words', errors);

  if (name === null || words === null || errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    wordSet: {
      ...(id === undefined ? {} : { id }),
      name,
      words,
    },
  };
}

interface IWordSetDraftValidationSuccess {
  ok: true;
  wordSet: IWordSetDraft;
}

interface IWordSetDraftValidationFailure {
  ok: false;
  errors: IValidationError[];
}

type WordSetDraftValidationResult = IWordSetDraftValidationSuccess | IWordSetDraftValidationFailure;

function readWords(input: unknown, path: string, errors: IValidationError[]): IWordDraft[] | null {
  if (!Array.isArray(input)) {
    errors.push({
      path,
      message: 'Поле words должно быть массивом.',
    });

    return null;
  }
  if (input.length === 0) {
    errors.push({
      path,
      message: 'Набор должен содержать хотя бы одно слово.',
    });
  }

  const words: IWordDraft[] = [];

  input.forEach((wordInput, index) => {
    const word = readWord(wordInput, `${path}[${index}]`, errors);

    if (word !== null) {
      words.push(word);
    }
  });

  return errors.length > 0 ? null : words;
}

function readWord(input: unknown, path: string, errors: IValidationError[]): IWordDraft | null {
  if (!isStructuredValue(input)) {
    errors.push({
      path,
      message: 'Слово должно быть объектом.',
    });

    return null;
  }

  const id = readOptionalTrimmedString(input, 'id', `${path}.id`, errors);
  const word = readRequiredTrimmedString(input, 'word', `${path}.word`, errors);
  const transcription = readRequiredTrimmedString(input, 'transcription', `${path}.transcription`, errors);
  const translation = readRequiredTrimmedString(input, 'translation', `${path}.translation`, errors);
  const example = readRequiredTrimmedString(input, 'example', `${path}.example`, errors);
  const exampleTranslation = readRequiredTrimmedString(input, 'exampleTranslation', `${path}.exampleTranslation`, errors);
  const declensions = readDeclensions(readProperty(input, 'declensions'), `${path}.declensions`, errors);

  if (
    word === null
    || transcription === null
    || translation === null
    || example === null
    || exampleTranslation === null
    || declensions === null
  ) {
    return null;
  }

  return {
    ...(id === undefined ? {} : { id }),
    word,
    transcription,
    translation,
    example,
    exampleTranslation,
    declensions,
  };
}

function readDeclensions(input: unknown, path: string, errors: IValidationError[]): IDeclensionsDraft | null {
  if (!isStructuredValue(input)) {
    errors.push({
      path,
      message: 'Поле declensions должно быть объектом.',
    });

    return null;
  }

  const singular = readDeclensionCollection(
    readProperty(input, GRAMMATICAL_NUMBER.SINGULAR),
    `${path}.${GRAMMATICAL_NUMBER.SINGULAR}`,
    errors,
  );
  const plural = readDeclensionCollection(
    readProperty(input, GRAMMATICAL_NUMBER.PLURAL),
    `${path}.${GRAMMATICAL_NUMBER.PLURAL}`,
    errors,
  );

  return singular === null || plural === null
    ? null
    : {
      singular,
      plural,
    };
}

function readDeclensionCollection(
  input: unknown,
  path: string,
  errors: IValidationError[],
): IDeclensionEntryDraft[] | null {
  if (!Array.isArray(input)) {
    errors.push({
      path,
      message: 'Склонения должны быть массивом.',
    });

    return null;
  }
  if (input.length !== GREEK_CASE_ARRAY.length) {
    errors.push({
      path,
      message: `Нужно указать ${GREEK_CASE_ARRAY.length} падежа в каноническом порядке.`,
    });
  }

  const entries: IDeclensionEntryDraft[] = [];
  const seenCases: GREEK_CASE[] = [];

  GREEK_CASE_ARRAY.forEach((expectedCase, index) => {
    const entryInput = input[index];

    if (entryInput === undefined) {
      return;
    }

    const entry = readDeclensionEntry(entryInput, `${path}[${index}]`, expectedCase, seenCases, errors);

    if (entry !== null) {
      entries.push(entry);
    }
  });

  return errors.length > 0 ? null : entries;
}

function readDeclensionEntry(
  input: unknown,
  path: string,
  expectedCase: GREEK_CASE,
  seenCases: GREEK_CASE[],
  errors: IValidationError[],
): IDeclensionEntryDraft | null {
  if (!isStructuredValue(input)) {
    errors.push({
      path,
      message: 'Запись склонения должна быть объектом.',
    });

    return null;
  }

  const caseText = readRequiredTrimmedString(input, 'case', `${path}.case`, errors);
  const form = readRequiredTrimmedString(input, 'form', `${path}.form`, errors);
  const translation = readRequiredTrimmedString(input, 'translation', `${path}.translation`, errors);
  const example = readRequiredTrimmedString(input, 'example', `${path}.example`, errors);
  const exampleTranslation = readRequiredTrimmedString(input, 'exampleTranslation', `${path}.exampleTranslation`, errors);

  if (caseText === null || form === null || translation === null || example === null || exampleTranslation === null) {
    return null;
  }
  if (!isGreekCase(caseText)) {
    errors.push({
      path: `${path}.case`,
      message: `Неподдерживаемый падеж: ${caseText}.`,
    });

    return null;
  }
  if (seenCases.includes(caseText)) {
    errors.push({
      path: `${path}.case`,
      message: `Падеж ${caseText} указан повторно.`,
    });
  }

  seenCases.push(caseText);

  if (caseText !== expectedCase) {
    errors.push({
      path: `${path}.case`,
      message: `Ожидался падеж ${expectedCase}.`,
    });
  }

  return errors.length > 0
    ? null
    : {
      case: caseText,
      form,
      translation,
      example,
      exampleTranslation,
    };
}

function normalizeWordSetIds(wordSet: IWordSetDraft): IWordSet {
  return {
    id: wordSet.id ?? createStableId('word-set', [wordSet.name]),
    name: wordSet.name,
    words: wordSet.words.map((word, index) => normalizeWordId(word, index)),
  };
}

function normalizeWordId(word: IWordDraft, index: number): IWord {
  return {
    id: word.id ?? createStableId('word', [word.word, String(index + 1)]),
    word: word.word,
    transcription: word.transcription,
    translation: word.translation,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    declensions: normalizeDeclensions(word.declensions),
  };
}

function normalizeDeclensions(declensions: IDeclensionsDraft): IDeclensions {
  return {
    singular: declensions.singular.map(normalizeDeclensionEntry),
    plural: declensions.plural.map(normalizeDeclensionEntry),
  };
}

function normalizeDeclensionEntry(entry: IDeclensionEntryDraft): IDeclensionEntry {
  return {
    case: entry.case,
    form: entry.form,
    translation: entry.translation,
    example: entry.example,
    exampleTranslation: entry.exampleTranslation,
  };
}

function collectDuplicateWordIdErrors(wordSet: IWordSet): IValidationError[] {
  const seenWordIds = new Set<string>();
  const errors: IValidationError[] = [];

  wordSet.words.forEach((word, index) => {
    if (seenWordIds.has(word.id)) {
      errors.push({
        path: `$.words[${index}].id`,
        message: `Идентификатор слова ${word.id} должен быть уникальным.`,
      });
    }

    seenWordIds.add(word.id);
  });

  return errors;
}

function createStableId(prefix: string, values: string[]): string {
  const slug = values
    .map(createSlugPart)
    .filter((part) => part.length > 0)
    .join('-');

  return `${prefix}-${slug.length > 0 ? slug : 'item'}`;
}

function createSlugPart(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function readRequiredTrimmedString(
  source: unknown,
  propertyName: string,
  path: string,
  errors: IValidationError[],
): string | null {
  const value = readProperty(source, propertyName);

  if (typeof value !== 'string') {
    errors.push({
      path,
      message: 'Ожидалась непустая строка.',
    });

    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    errors.push({
      path,
      message: 'Строка не должна быть пустой.',
    });

    return null;
  }

  return trimmed;
}

function readOptionalTrimmedString(
  source: unknown,
  propertyName: string,
  path: string,
  errors: IValidationError[],
): string | undefined {
  const value = readProperty(source, propertyName);

  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    errors.push({
      path,
      message: 'Если идентификатор указан, он должен быть строкой.',
    });

    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    errors.push({
      path,
      message: 'Идентификатор не должен быть пустым.',
    });

    return undefined;
  }

  return trimmed;
}

function readProperty(source: unknown, propertyName: string): unknown {
  if (!isStructuredValue(source)) {
    return undefined;
  }

  return Object.getOwnPropertyDescriptor(source, propertyName)?.value;
}

function isStructuredValue(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isGreekCase(value: string): value is GREEK_CASE {
  return GREEK_CASE_ARRAY.some((greekCase) => greekCase === value);
}
