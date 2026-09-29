import { describe, expect, it } from 'vitest';
import { safeHref } from './safe-url';

describe('safeHref', () => {
  it('keeps http(s) links', () => {
    expect(safeHref('https://github.com/me')).toBe('https://github.com/me');
  });

  it('adds https to bare domains', () => {
    expect(safeHref('github.com/me/project')).toBe('https://github.com/me/project');
  });

  it('blocks dangerous protocols', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref(' JavaScript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('ignores empty values', () => {
    expect(safeHref('')).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });
});
