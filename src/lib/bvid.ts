const BVID_RE = /BV[0-9A-Za-z]{10}/

export function parseBvid(input: string): string | null {
  const match = input.match(BVID_RE)
  return match ? match[0] : null
}
