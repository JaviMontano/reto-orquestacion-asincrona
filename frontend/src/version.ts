export function compareDecimalVersions(left: string, right: string): number {
  if (!isCanonicalDecimal(left) || !isCanonicalDecimal(right)) {
    throw new Error('La versión debe ser un decimal canónico')
  }
  // Length-first comparison avoids losing BIGINT precision in JavaScript Number.
  return left.length === right.length ? left.localeCompare(right) : left.length - right.length
}

function isCanonicalDecimal(value: string): boolean {
  return /^(0|[1-9][0-9]*)$/.test(value)
}
