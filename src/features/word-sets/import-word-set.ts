import type { IWordSetRepository } from '../../persistence/indexed-db';
import type { IStore } from '../../state/store';
import type { IUiState } from '../ui-state/ui-state';
import { UI_ACTION_TYPE, type UiAction } from '../ui-state/ui-state';
import {
  type IValidationError,
  parseWordSetJson,
} from './word-sets';

export interface IFileTextReader {
  (file: File): Promise<string>;
}

export interface IImportCurrentCheck {
  (): boolean;
}

export interface IImportWordSetOptions {
  file: File;
  isCurrentOperation: IImportCurrentCheck;
  readFileText?: IFileTextReader;
  repository: IWordSetRepository;
  store: IStore<IUiState, UiAction>;
}

export async function importWordSetFile(options: IImportWordSetOptions): Promise<void> {
  options.store.dispatch({
    type: UI_ACTION_TYPE.IMPORT_STARTED,
  });

  const fileTextResult = await readSelectedFile(options.file, options.readFileText ?? readFileText);

  if (!options.isCurrentOperation()) {
    return;
  }
  if (!fileTextResult.ok) {
    options.store.dispatch({
      type: UI_ACTION_TYPE.IMPORT_FAILED,
      errorMessage: fileTextResult.errorMessage,
    });

    return;
  }

  const validationResult = parseWordSetJson(fileTextResult.text);

  if (!options.isCurrentOperation()) {
    return;
  }
  if (!validationResult.ok) {
    options.store.dispatch({
      type: UI_ACTION_TYPE.IMPORT_FAILED,
      errorMessage: formatValidationErrors(validationResult.errors),
    });

    return;
  }

  const saveResult = await options.repository.save(validationResult.wordSet);

  if (!options.isCurrentOperation()) {
    return;
  }
  if (!saveResult.ok) {
    options.store.dispatch({
      type: UI_ACTION_TYPE.IMPORT_FAILED,
      errorMessage: `Не удалось сохранить набор слов: ${saveResult.error.message}`,
    });

    return;
  }

  options.store.dispatch({
    type: UI_ACTION_TYPE.IMPORT_SUCCEEDED,
    wordSet: validationResult.wordSet,
  });
}

interface IFileReadSuccess {
  ok: true;
  text: string;
}

interface IFileReadFailure {
  ok: false;
  errorMessage: string;
}

type FileReadResult = IFileReadSuccess | IFileReadFailure;

async function readSelectedFile(file: File, fileTextReader: IFileTextReader): Promise<FileReadResult> {
  try {
    return {
      ok: true,
      text: await fileTextReader(file),
    };
  } catch (error) {
    return {
      ok: false,
      errorMessage: `Не удалось прочитать файл: ${getErrorMessage(error)}`,
    };
  }
}

function readFileText(file: File): Promise<string> {
  return file.text();
}

function formatValidationErrors(errors: IValidationError[]): string {
  const details = errors.map((error) => `${error.path}: ${error.message}`).join(' ');

  return `Не удалось импортировать набор слов. ${details}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Неизвестная ошибка.';
}
