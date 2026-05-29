import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
  });

  it('returns empty string when no classes', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});
