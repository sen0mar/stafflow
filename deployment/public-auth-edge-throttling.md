# Public auth edge throttling

Stafflow does not use an in-process limiter because counters would be isolated per Render instance. Public auth throttling must run before requests reach Render.

The repository cannot activate this external control by itself: it contains no Render service identifier, Cloudflare zone identifier, or provider API credential. Render automatically provides general DDoS filtering, but its documented edge protection does not expose repository-configurable, path-specific auth throttling. The supported target is a Cloudflare-proxied custom API domain in front of Render.

## Required production topology

1. Add the production API custom domain, such as `api.example.com`, to the Render web service and wait for certificate verification.
2. In Cloudflare DNS, point the API CNAME to the Render service hostname. Set SSL/TLS mode to `Full`, then enable the proxied (orange-cloud) status after Render has issued the certificate.
3. Disable the service's `onrender.com` subdomain in Render. Otherwise clients can bypass the Cloudflare zone rule by calling the Render hostname directly.
4. Keep `CLIENT_URL` and `VITE_API_URL` aligned with the custom production domains.

Render documents the custom-domain setup at <https://render.com/docs/configure-cloudflare-dns> and disabling the default hostname at <https://render.com/docs/custom-domains>. Cloudflare documents zone rate-limit rules at <https://developers.cloudflare.com/waf/rate-limiting-rules/>.

## Baseline rule

Create one zone-level WAF rate-limiting rule using [`cloudflare-public-auth-rate-limit-rule.json`](./cloudflare-public-auth-rate-limit-rule.json). This single rule fits Cloudflare's documented Free-plan allowance and covers all public credential/token entry points.

- Match paths: `/auth/login` and `/auth/invitations/accept`
- Counting characteristics: source IP and Cloudflare data-center ID
- Threshold: 5 requests per 10 seconds
- Action: block for 10 seconds

In the Cloudflare dashboard, open the API domain's zone, select **Security → WAF → Rate limiting rules**, create the rule with those exact values, and deploy it last in the rate-limit ruleset. The baseline deliberately uses only URI paths, which are available on the Free plan. On a paid plan, retain the baseline until observed production traffic supports a carefully tested longer window.

To add the rule through the Rulesets API when an `http_ratelimit` entry-point ruleset already exists, send the JSON artifact as the request body:

```sh
curl "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/rulesets/$CLOUDFLARE_RATE_LIMIT_RULESET_ID/rules" \
  --request POST \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data-binary @deployment/cloudflare-public-auth-rate-limit-rule.json
```

Use a scoped API token with permission to edit zone WAF rules. Never commit the token or provider identifiers. If the `http_ratelimit` entry-point ruleset does not exist, create the rule through the dashboard or follow Cloudflare's entry-point ruleset creation procedure: <https://developers.cloudflare.com/waf/rate-limiting-rules/create-api/>.

## Activation verification

After deployment:

1. Confirm the API custom domain resolves through Cloudflare and the direct `onrender.com` hostname returns `404`.
2. From a non-allowlisted test IP, send six JSON login requests within 10 seconds using a nonexistent test email. The first requests should reach Stafflow and return `401`; a later request must be stopped by Cloudflare before Render receives it.
3. Confirm the Cloudflare Security events view records the rate-limit action and Render logs do not contain the blocked request ID.
4. Repeat against one token path with syntactically valid bounded JSON, then wait for the mitigation window and confirm normal traffic resumes.
5. Monitor false positives and auth failure volume. Do not loosen the rule without retaining a finite provider-enforced bound.

Cloudflare notes that distributed rate counters can take a few seconds to update, so the configured number is a practical edge bound rather than a guarantee that exactly five requests reach the origin.
