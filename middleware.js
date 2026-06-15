// Vercel Edge Middleware — gate the entire prototypes site behind an access code.
//
// The valid codes live HERE (server-side) and are never shipped to the browser.
// Flow:
//   • Request to /gate.html ............... always allowed
//   • ?code=<valid> ...................... set cookie, 302 to the clean target
//   • ?code=<invalid> .................... 302 to /gate.html?e=1
//   • Has the access cookie .............. pass through
//   • Otherwise (locked) ................. 302 to /gate.html?to=<original path>

const CODES = new Set(['2716', '4207', '1958']);
const COOKIE = 'hp_access';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const config = {
  // Run on every path (so deep links into any prototype are gated too).
  matcher: ['/(.*)'],
};

// Mirror @vercel/edge's next(): let the request continue to the resource.
function pass() {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // The gate page itself is always reachable.
  if (path === '/gate.html') return pass();

  // Code submission via ?code=
  const code = url.searchParams.get('code');
  if (code !== null) {
    if (CODES.has(code.trim())) {
      url.searchParams.delete('code');
      const target = url.pathname + (url.search || '');
      return new Response(null, {
        status: 302,
        headers: {
          Location: target,
          'Set-Cookie': `${COOKIE}=1; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax; Secure`,
        },
      });
    }
    // Wrong code -> back to the gate with an error flag.
    return new Response(null, { status: 302, headers: { Location: '/gate.html?e=1' } });
  }

  // Already unlocked?
  const cookie = request.headers.get('cookie') || '';
  if (cookie.split(/;\s*/).indexOf(`${COOKIE}=1`) !== -1) return pass();

  // Locked -> send to the gate, remembering where they wanted to go.
  const to = encodeURIComponent(path + (url.search || ''));
  return new Response(null, { status: 302, headers: { Location: `/gate.html?to=${to}` } });
}
