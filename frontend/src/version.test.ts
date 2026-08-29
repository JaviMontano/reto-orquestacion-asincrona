import { describe, expect, it } from 'vitest'
import { compareDecimalVersions } from './version'

describe('compareDecimalVersions', () => {
  it('compares values beyond Number safe precision', () => {
    expect(compareDecimalVersions('9007199254740993', '9007199254740992')).toBeGreaterThan(0)
    expect(compareDecimalVersions('9', '10')).toBeLessThan(0)
  })

  it('rejects non-canonical versions', () => {
    expect(() => compareDecimalVersions('01', '1')).toThrow()
  })
})
