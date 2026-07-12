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

export interface IDeclensionEntry {
  case: GREEK_CASE;
  form: string;
  translation: string;
  example: string;
  exampleTranslation: string;
}

export interface IDeclensions {
  singular: IDeclensionEntry[];
  plural: IDeclensionEntry[];
}

export interface IWord {
  id: string;
  word: string;
  transcription: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  declensions: IDeclensions;
}

export interface IWordSet {
  id: string;
  name: string;
  words: IWord[];
}

export interface IPersistedWordSetRecord {
  id: string;
  schemaVersion: number;
  name: string;
  words: IWord[];
  createdAt: string;
  updatedAt: string;
}

export interface IValidationError {
  path: string;
  message: string;
}

export interface IWordSetValidationSuccess {
  ok: true;
  wordSet: IWordSet;
}

export interface IWordSetValidationFailure {
  ok: false;
  errors: IValidationError[];
}

export type WordSetValidationResult = IWordSetValidationSuccess | IWordSetValidationFailure;
