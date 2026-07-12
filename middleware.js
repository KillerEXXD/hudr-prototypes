// Vercel Edge Middleware — gate the prototypes site behind access codes.
//
// The valid codes live HERE (server-side) and are never shipped to the browser.
//
// Two tiers of access:
//   • SITE_CODES ...... unlock the WHOLE site      (cookie hp_access=1)
//   • REFERRAL_CODE ... unlocks ONLY /clubr-referral (cookie hp_ref=1)
//
// Flow:
//   • Request to /gate.html ...................... always allowed
//   • ?code=<site code> .......................... set hp_access, 302 to clean target
//   • ?code=2716 on a /clubr-referral path ....... set hp_ref, 302 to clean target
//   • ?code=2716 anywhere else ................... 302 to /gate.html?e=1 (rejected)
//   • ?code=<invalid> ............................ 302 to /gate.html?e=1
//   • Has a matching access cookie ............... pass through
//   • Otherwise (locked) ......................... 302 to /gate.html?to=<original path>

const SITE_CODES = new Set(['4207', '1958']); // unlock the entire site
const REFERRAL_CODE = '2716';                 // unlocks ONLY /clubr-referral
const REFERRAL_PREFIX = '/clubr-referral';

const SITE_COOKIE = 'hp_access';
const REF_COOKIE = 'hp_ref';
const MAX_AGE = 60 * 60 * 2; // 2 hours

export const config = {
  // Run on every path (so deep links into any prototype are gated too).
  matcher: ['/(.*)'],
};

// Mirror @vercel/edge's next(): let the request continue to the resource.
function pass() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

// Path is /clubr-referral or a subpath of it (NOT e.g. /clubr-referral-app).
function isReferralPath(path) {
  return path === REFERRAL_PREFIX || path.indexOf(REFERRAL_PREFIX + '/') === 0;
}

function hasCookie(request, name) {
  const cookie = request.headers.get('cookie') || '';
  return cookie.split(/;\s*/).indexOf(name + '=1') !== -1;
}

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // The gate page itself is always reachable.
  if (path === '/gate.html') return pass();

  const onReferral = isReferralPath(path);

  // Code submission via ?code=
  const code = url.searchParams.get('code');
  if (code !== null) {
    const c = code.trim();
    let cookie = null;
    if (SITE_CODES.has(c)) cookie = SITE_COOKIE;               // whole site
    else if (c === REFERRAL_CODE && onReferral) cookie = REF_COOKIE; // referral only

    if (cookie) {
      url.searchParams.delete('code');
      const target = url.pathname + (url.search || '');
      return new Response(null, {
        status: 302,
        headers: {
          Location: target,
          'Set-Cookie': `${cookie}=1; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`,
        },
      });
    }
    // Wrong code (or 2716 outside /clubr-referral) -> back to the gate.
    return new Response(null, { status: 302, headers: { Location: '/gate.html?e=1' } });
  }

  // Already unlocked?
  if (hasCookie(request, SITE_COOKIE)) return pass();              // site-wide access
  if (onReferral && hasCookie(request, REF_COOKIE)) return pass(); // referral-only access

  // Locked -> send to the gate, remembering where they wanted to go.
  const to = encodeURIComponent(path + (url.search || ''));
  return new Response(null, { status: 302, headers: { Location: `/gate.html?to=${to}` } });
}
