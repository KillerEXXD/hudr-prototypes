// Prototype: the gallery has no backend, so city suggestions come from the bundled
// list (the live app proxies a free geocoder via /places-search — see the app's
// cityAutocomplete.ts + docs/CITY_AUTOCOMPLETE.md). Same CityField, mock data source.

import { searchCities } from '@/lib/cities'

export async function fetchCitySuggestions(input: string): Promise<string[]> {
  const q = input.trim()
  return q.length < 2 ? [] : searchCities(q)
}
