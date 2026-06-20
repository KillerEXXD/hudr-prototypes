// Bundled city list for the onboarding typeahead — no external API/key.
// Curated major world cities (US-heavy for the pilot). Extend freely; the
// typeahead does a simple case-insensitive prefix/substring match.

export const CITIES: string[] = [
  // United States
  'New York, NY, USA', 'Los Angeles, CA, USA', 'Chicago, IL, USA', 'Houston, TX, USA',
  'Phoenix, AZ, USA', 'Philadelphia, PA, USA', 'San Antonio, TX, USA', 'San Diego, CA, USA',
  'Dallas, TX, USA', 'Austin, TX, USA', 'San Jose, CA, USA', 'Fort Worth, TX, USA',
  'Jacksonville, FL, USA', 'Columbus, OH, USA', 'Charlotte, NC, USA', 'Indianapolis, IN, USA',
  'San Francisco, CA, USA', 'Seattle, WA, USA', 'Denver, CO, USA', 'Washington, DC, USA',
  'Boston, MA, USA', 'Nashville, TN, USA', 'Las Vegas, NV, USA', 'Portland, OR, USA',
  'Oklahoma City, OK, USA', 'Memphis, TN, USA', 'Louisville, KY, USA', 'Milwaukee, WI, USA',
  'Baltimore, MD, USA', 'Atlanta, GA, USA', 'Miami, FL, USA', 'Tampa, FL, USA',
  'Orlando, FL, USA', 'Minneapolis, MN, USA', 'New Orleans, LA, USA', 'Kansas City, MO, USA',
  'Sacramento, CA, USA', 'Salt Lake City, UT, USA', 'Pittsburgh, PA, USA', 'Cincinnati, OH, USA',
  'St. Louis, MO, USA', 'Raleigh, NC, USA', 'Cleveland, OH, USA', 'Detroit, MI, USA',
  'Little Rock, AR, USA', 'Tulsa, OK, USA', 'Boise, ID, USA', 'Honolulu, HI, USA',
  // Canada
  'Toronto, ON, Canada', 'Montreal, QC, Canada', 'Vancouver, BC, Canada', 'Calgary, AB, Canada',
  'Ottawa, ON, Canada', 'Edmonton, AB, Canada', 'Winnipeg, MB, Canada',
  // UK & Ireland
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Glasgow, UK', 'Edinburgh, UK',
  'Liverpool, UK', 'Leeds, UK', 'Bristol, UK', 'Dublin, Ireland', 'Belfast, UK',
  // Europe
  'Paris, France', 'Marseille, France', 'Lyon, France', 'Berlin, Germany', 'Munich, Germany',
  'Frankfurt, Germany', 'Hamburg, Germany', 'Madrid, Spain', 'Barcelona, Spain', 'Lisbon, Portugal',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Amsterdam, Netherlands', 'Rotterdam, Netherlands',
  'Brussels, Belgium', 'Vienna, Austria', 'Zurich, Switzerland', 'Geneva, Switzerland',
  'Stockholm, Sweden', 'Oslo, Norway', 'Copenhagen, Denmark', 'Helsinki, Finland',
  'Warsaw, Poland', 'Prague, Czechia', 'Budapest, Hungary', 'Athens, Greece', 'Bucharest, Romania',
  'Kyiv, Ukraine', 'Istanbul, Türkiye', 'Moscow, Russia',
  // Middle East
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Doha, Qatar', 'Riyadh, Saudi Arabia', 'Tel Aviv, Israel',
  'Cairo, Egypt',
  // Asia
  'Mumbai, India', 'Delhi, India', 'Bengaluru, India', 'Hyderabad, India', 'Chennai, India',
  'Kolkata, India', 'Pune, India', 'Singapore', 'Hong Kong', 'Tokyo, Japan', 'Osaka, Japan',
  'Seoul, South Korea', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia',
  'Manila, Philippines', 'Ho Chi Minh City, Vietnam', 'Shanghai, China', 'Beijing, China',
  'Shenzhen, China', 'Taipei, Taiwan',
  // Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand',
  // Africa
  'Lagos, Nigeria', 'Johannesburg, South Africa', 'Cape Town, South Africa', 'Nairobi, Kenya',
  'Accra, Ghana',
  // Latin America
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'São Paulo, Brazil',
  'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina', 'Santiago, Chile', 'Bogotá, Colombia',
  'Lima, Peru',
]

/** Case-insensitive typeahead: prefix matches first, then substring. */
export function searchCities(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const prefix: string[] = []
  const contains: string[] = []
  for (const c of CITIES) {
    const lc = c.toLowerCase()
    if (lc.startsWith(q)) prefix.push(c)
    else if (lc.includes(q)) contains.push(c)
    if (prefix.length >= limit) break
  }
  return [...prefix, ...contains].slice(0, limit)
}
