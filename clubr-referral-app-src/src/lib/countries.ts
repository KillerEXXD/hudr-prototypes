// Country dial codes for the phone-OTP field. `dial` is digits only (no +);
// the field emits `+<dial><national>` and the auth layer strips non-digits.
// US is the default. List covers the common markets; extend as needed.

export interface Country {
  code: string // ISO 3166-1 alpha-2
  name: string
  dial: string // country calling code, digits only
  flag: string // emoji
  nationalLen?: number // expected national-number length (digits, after the trunk 0 is dropped)
}

export const DEFAULT_COUNTRY = 'US'

// Popular first (poker-club markets), then broadly alphabetical by name.
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸', nationalLen: 10 },
  { code: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', nationalLen: 10 },
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', nationalLen: 10 },
  { code: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', nationalLen: 9 },
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳', nationalLen: 10 },
  { code: 'AR', name: 'Argentina', dial: '54', flag: '🇦🇷' },
  { code: 'AT', name: 'Austria', dial: '43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', dial: '32', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', dial: '55', flag: '🇧🇷' },
  { code: 'BG', name: 'Bulgaria', dial: '359', flag: '🇧🇬' },
  { code: 'CL', name: 'Chile', dial: '56', flag: '🇨🇱' },
  { code: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', dial: '57', flag: '🇨🇴' },
  { code: 'HR', name: 'Croatia', dial: '385', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czechia', dial: '420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', dial: '45', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', dial: '20', flag: '🇪🇬' },
  { code: 'FI', name: 'Finland', dial: '358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', dial: '30', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', dial: '852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dial: '36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', dial: '354', flag: '🇮🇸' },
  { code: 'ID', name: 'Indonesia', dial: '62', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', dial: '972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵' },
  { code: 'MY', name: 'Malaysia', dial: '60', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', dial: '52', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria', dial: '234', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway', dial: '47', flag: '🇳🇴' },
  { code: 'PH', name: 'Philippines', dial: '63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', dial: '48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dial: '351', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', dial: '40', flag: '🇷🇴' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa', dial: '27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dial: '82', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', dial: '46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dial: '41', flag: '🇨🇭' },
  { code: 'TW', name: 'Taiwan', dial: '886', flag: '🇹🇼' },
  { code: 'TH', name: 'Thailand', dial: '66', flag: '🇹🇭' },
  { code: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { code: 'UA', name: 'Ukraine', dial: '380', flag: '🇺🇦' },
  { code: 'VN', name: 'Vietnam', dial: '84', flag: '🇻🇳' },
]

export function countryByCode(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]
}

/**
 * Strip a national number down to E.164 digits: remove non-digits, then drop the
 * leading trunk `0`. In E.164 the trunk prefix is never carried, so e.g. an Indian
 * "09500040621" and "9500040621" are the SAME subscriber — without this, the two
 * produced distinct accounts (+9109500040621 vs +919500040621). Mobile-only OTP, so
 * the Italian-landline "keep the 0" exception doesn't apply here.
 */
export function nationalDigits(national: string): string {
  return national.replace(/\D/g, '').replace(/^0+/, '')
}

/**
 * Combine a country (ISO code) and a national number into `+<dial><digits>`.
 * Returns '' when there's no national number yet. Non-digits and the trunk 0 are
 * stripped, so the caller can pass loosely-formatted input like "(555) 123-4567".
 */
export function toE164(isoCode: string, national: string): string {
  const digits = nationalDigits(national)
  return digits ? `+${countryByCode(isoCode).dial}${digits}` : ''
}

/**
 * True when the national number has a plausible length for the selected country —
 * an exact match when we know the country's length, otherwise a generic 6–14 digit
 * range (E.164 allows ≤15 total incl. the dial code). Used to gate "Send code" so a
 * mistyped (too short / extra-digit) number can't create a junk account.
 */
export function isValidNational(isoCode: string, national: string): boolean {
  const digits = nationalDigits(national)
  const len = countryByCode(isoCode).nationalLen
  return len ? digits.length === len : digits.length >= 6 && digits.length <= 14
}

// Build a name→Country and ISO→Country lookup once (case-insensitive by name).
const BY_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]))
const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]))

/**
 * Resolve a player's country — which may arrive as a verbose name ("United States"),
 * a location string ("Houston, TX, United States"), an ISO-2 code ("US"), or an
 * already-rendered flag emoji ("🇺🇸") — to a compact display token:
 *   • the flag emoji when we recognise the country, else
 *   • a 3-letter UPPERCASE code derived from the country word (e.g. "Wakanda" → "WAK").
 * Returns '' for an empty/unknown-empty value so callers can fall back as they like.
 * Used everywhere a player country is shown so the flag treatment is consistent.
 */
export function countryFlag(raw?: string | null): string {
  if (!raw) return ''
  const s = raw.trim()
  if (!s) return ''
  // Already a flag emoji (a pair of regional-indicator symbols)? Pass it through.
  if (/\p{Regional_Indicator}/u.test(s)) return s
  // Bare ISO-3166 alpha-2 code, e.g. "US".
  if (/^[A-Za-z]{2}$/.test(s)) { const c = BY_CODE.get(s.toUpperCase()); if (c) return c.flag }
  // Verbose name or "City, ST, Country" — the country is the last comma-segment.
  const last = (s.split(',').pop() ?? s).trim()
  const c = BY_NAME.get(last.toLowerCase()) ?? BY_NAME.get(s.toLowerCase())
  if (c) return c.flag
  // Unknown country → a 3-letter uppercase code from its first letters.
  const word = last.replace(/[^A-Za-z]/g, '')
  return word ? word.slice(0, 3).toUpperCase() : ''
}
