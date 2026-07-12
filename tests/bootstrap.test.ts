import { describe, expect, it } from 'vitest';

import { bootstrapApp } from '../src/app/bootstrap';

describe('bootstrapApp', () => {
  it('renders the initial application shell', () => {
    document.body.innerHTML = '<main data-app-root></main>';

    bootstrapApp();

    expect(document.querySelector('h1')?.textContent).toBe('Λέξεις');
  });
});
