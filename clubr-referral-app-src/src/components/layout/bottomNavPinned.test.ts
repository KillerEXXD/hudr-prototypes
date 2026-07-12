import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// BUG-937 — on iOS Safari the bottom nav floated up to mid-screen on a Last Longer
// game page. Cause: `position: sticky; bottom: 0` inside a `min-h-dvh` shell — iOS
// resolves the sticky offset against the large (toolbar-hidden) viewport, pinning the
// nav above the visual bottom. Fix: make the nav `fixed` (centered to the max-w-md
// phone frame) and pad <main> so content stays clear of it. Structural guard so a
// future change can't silently revert to the broken `sticky bottom-0`.
describe('BUG-937: the bottom nav stays pinned to the viewport bottom (iOS-safe)', () => {
  const nav = readFileSync(resolve(process.cwd(), 'src/components/layout/BottomNav.tsx'), 'utf8')
  const shell = readFileSync(resolve(process.cwd(), 'src/components/layout/AppShell.tsx'), 'utf8')

  it('nav is `fixed` to the viewport (NOT `sticky bottom-0`), centered to the phone frame', () => {
    const navClass = nav.match(/<nav className="([^"]+)"/)![1]
    expect(navClass).toMatch(/\bfixed\b/)
    expect(navClass).not.toMatch(/\bsticky\b/) // the iOS-buggy positioning must not come back
    expect(navClass).toMatch(/bottom-0/)
    expect(navClass).toMatch(/max-w-md/)         // constrained to the phone-frame width
    expect(navClass).toMatch(/-translate-x-1\/2/) // centered on the viewport
  })

  it('<main> reserves bottom space so content is not hidden behind the fixed nav', () => {
    const mainClass = shell.match(/<main className="([^"]+)"/)![1]
    expect(mainClass).toMatch(/pb-2[0-9]|pb-\[/) // pb-24 (or an arbitrary calc) clears ~66px + safe-area
  })
})
