export enum THEME_MODE {
  LIGHT = 'light',
  DARK = 'dark',
}

export const THEME_MODE_ARRAY = Object.values(THEME_MODE);

export enum PAGE_PHASE {
  EMPTY = 'empty',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
}

export const PAGE_PHASE_ARRAY = Object.values(PAGE_PHASE);

export enum TRANSLATION_GROUP {
  WORD = 'word',
  EXAMPLE = 'example',
}

export const TRANSLATION_GROUP_ARRAY = Object.values(TRANSLATION_GROUP);
