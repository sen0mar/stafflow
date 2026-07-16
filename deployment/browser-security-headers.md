# Browser Security Headers

Both Vercel configurations apply the same baseline browser policy to every
frontend route:

- `Referrer-Policy: no-referrer` prevents invitation URLs and other page URLs
  from being disclosed by browser referrer headers.
- `X-Content-Type-Options: nosniff` disables MIME sniffing.
- `X-Frame-Options: DENY` prevents the Stafflow frontend from being framed.
- `Permissions-Policy` disables camera, geolocation, and microphone access,
  which the MVP does not use.

## Deployment-specific CSP

Stafflow deliberately does not ship a guessed Content Security Policy. The
frontend may call a separately deployed API and embed private Cloudflare R2
payslip previews. A safe CSP therefore depends on the final Vercel frontend,
Render/custom API, and R2 origins, as well as the production font and asset
sources.

Before enabling CSP for a deployment, inventory those concrete origins, test
the policy in report-only mode, then promote the verified directives to an
enforced Vercel header. In particular, verify `connect-src` for the API and
`frame-src` for private R2 previews. Do not add wildcard sources merely to make
an unverified policy pass.
