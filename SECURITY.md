# Security hardening

This site is intentionally static: no forms, accounts, API endpoints, cookies, or third-party scripts are required.

## Active on GitHub Pages

The HTML pages include a strict `Content-Security-Policy` meta policy and `Referrer-Policy`. The CSP only permits local scripts, styles, images, fonts, and video; network connections, plugins, forms, frames, workers, and manifests are blocked.

GitHub Pages does not provide project-level custom response headers. Therefore headers that must be sent by the server cannot be enforced there.

## When moving to the final domain

Use the host-level security headers included in this repository:

- `_headers` works on hosts that support the common static `_headers` format, including Cloudflare Pages and Netlify.
- `vercel.json` applies equivalent headers on Vercel.

If a different host is selected, copy the same values into that host's response-header configuration.

After the final HTTPS domain is stable, consider adding HSTS (`Strict-Transport-Security`). Do not enable HSTS with `includeSubDomains` or `preload` until every relevant subdomain is confirmed to support HTTPS.

## DOM safety

FAQ content is built with DOM APIs and `textContent`; the application does not use `innerHTML`, `eval`, `new Function`, or inline event handlers.
