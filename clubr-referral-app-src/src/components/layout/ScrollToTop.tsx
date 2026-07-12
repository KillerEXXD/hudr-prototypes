import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Entering a page (club, profile, game…) should start at the TOP, not wherever the
 * previous page was scrolled. We scroll the window to the top on every PATHNAME change
 * — EXCEPT a browser back/forward ('POP'), where the user expects their previous
 * scroll position to be restored.
 *
 * Keyed on pathname only (not search), so in-page filter/tab changes — which update
 * the query string (e.g. /live?view=finished) — do NOT yank the page to the top and
 * leave features like the sticky filter summary intact.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  // Mirror the latest nav type into a ref (in an effect, never during render) so the
  // scroll effect can read it without making navType a dependency — that keeps the
  // scroll firing once per real page change, not on every query-string update.
  const navRef = useRef(navType)
  useEffect(() => { navRef.current = navType })
  useEffect(() => {
    if (navRef.current !== 'POP') window.scrollTo({ top: 0, left: 0 })
  }, [pathname])
  return null
}
