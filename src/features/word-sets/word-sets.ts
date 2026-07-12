export {
  GRAMMATICAL_NUMBER,
  GRAMMATICAL_NUMBER_ARRAY,
  GREEK_CASE,
  GREEK_CASE_ARRAY,
  type IDeclensionEntry,
  type IDeclensions,
  type IPersistedWordSetRecord,
  type IValidationError,
  type IWord,
  type IWordSet,
  type IWordSetValidationFailure,
  type IWordSetValidationSuccess,
  type WordSetValidationResult,
} from './domain';
export {
  parseWordSetJson,
  validateWordSetInput,
} from './validation';
