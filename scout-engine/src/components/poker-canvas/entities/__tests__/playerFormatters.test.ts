/**
 * Unit tests for playerFormatters.ts
 */

import { describe, it, expect } from 'vitest'
import {
  toTitleCase,
  getDisplayName,
  truncateName,
  formatAmount,
  formatStackWithCommas,
} from '../playerFormatters'

// =====================
// toTitleCase Tests
// =====================

describe('toTitleCase', () => {
  it('should capitalize first letter and lowercase rest', () => {
    expect(toTitleCase('HELLO')).toBe('Hello')
  })

  it('should handle already title-cased word', () => {
    expect(toTitleCase('Hello')).toBe('Hello')
  })

  it('should handle all lowercase', () => {
    expect(toTitleCase('hello')).toBe('Hello')
  })

  it('should return empty string for empty input', () => {
    expect(toTitleCase('')).toBe('')
  })

  it('should handle single character', () => {
    expect(toTitleCase('a')).toBe('A')
  })
})

// =====================
// getDisplayName Tests
// =====================

describe('getDisplayName', () => {
  it('should return last name in title case for multi-word name', () => {
    expect(getDisplayName('Phil Ivey')).toBe('Ivey')
  })

  it('should return title case for single name', () => {
    expect(getDisplayName('PHIL')).toBe('Phil')
  })

  it('should handle three-part names', () => {
    expect(getDisplayName('Daniel Joseph Negreanu')).toBe('Negreanu')
  })

  it('should handle extra whitespace', () => {
    expect(getDisplayName('  Phil   Ivey  ')).toBe('Ivey')
  })

  it('should return empty string for empty input', () => {
    expect(getDisplayName('')).toBe('')
  })

  it('should return empty string for whitespace-only input', () => {
    expect(getDisplayName('   ')).toBe('')
  })
})

// =====================
// truncateName Tests
// =====================

describe('truncateName', () => {
  it('should not truncate short names', () => {
    expect(truncateName('Phil Ivey', 10)).toBe('Ivey')
  })

  it('should truncate long names with dot', () => {
    expect(truncateName('Daniel Negreanu', 5)).toBe('Negr.')
  })

  it('should handle exact length', () => {
    expect(truncateName('Phil Ivey', 4)).toBe('Ivey')
  })

  it('should truncate when one character over', () => {
    expect(truncateName('Phil Ivey', 3)).toBe('Iv.')
  })
})

// =====================
// formatAmount Tests
// =====================

describe('formatAmount', () => {
  it('should format millions', () => {
    expect(formatAmount(1500000)).toBe('1.50M')
  })

  it('should format exactly 1 million', () => {
    expect(formatAmount(1000000)).toBe('1.00M')
  })

  it('should format large thousands with no decimals', () => {
    expect(formatAmount(50000)).toBe('50K')
  })

  it('should format small thousands with decimals', () => {
    expect(formatAmount(1500)).toBe('1.50K')
  })

  it('should format exactly 1000', () => {
    expect(formatAmount(1000)).toBe('1.00K')
  })

  it('should format small numbers with commas', () => {
    expect(formatAmount(500)).toBe('500')
  })

  it('should format numbers under 100 with decimals', () => {
    expect(formatAmount(50.5)).toBe('50.5')
  })

  it('should format zero', () => {
    expect(formatAmount(0)).toBe('0')
  })
})

// =====================
// formatStackWithCommas Tests
// =====================

describe('formatStackWithCommas', () => {
  it('should add commas to large numbers', () => {
    expect(formatStackWithCommas(1000000)).toBe('1,000,000')
  })

  it('should format small numbers without commas', () => {
    expect(formatStackWithCommas(500)).toBe('500')
  })

  it('should format numbers under 100 with decimals', () => {
    expect(formatStackWithCommas(50.5)).toBe('50.5')
  })

  it('should format zero', () => {
    expect(formatStackWithCommas(0)).toBe('0')
  })

  it('should handle large numbers with commas', () => {
    expect(formatStackWithCommas(12345678)).toBe('12,345,678')
  })
})
