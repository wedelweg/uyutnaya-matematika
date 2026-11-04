# Publication audit

Prepared from a separate copy. No original Git history, runtime profiles or backups were copied.

Removed or replaced:
- Child name, personalized greeting and dedication in application text, defaults, manifest and tests.
- Local user paths and hard-coded browser executable path (environment override instead).
- Personal server hostname, IP, document root and deployment/SSH scripts: excluded entirely.
- Prior deployment notes, screenshots, archives, test traces and build outputs: excluded.
- Existing Git metadata: excluded; new history only.

No actual credential, private key, token, .env file, child photograph or user-progress export
was found in the selected publication files. Dependency metadata is not personal profile data.
The author's explicitly requested name appears in LICENSE and README only.

Images were retained unchanged at the owner's explicit request. Redistribution permission
for Sanrio artwork is unverified; see THIRD_PARTY_NOTICES.md. Dependencies retain their own
licenses; the generated inventory omits machine paths and maintainer contact details.
MPL-2.0 files remain third-party packages, not relicensed under MIT.

Verification: npm ci, ESLint, strict TypeScript, Vitest and Vite build; Playwright browser checks.
Physical iPhone installation is not certified by desktop browser checks.

npm audit reports transitive development-tool advisories (including Workbox build and glob
chains). No forced major-version downgrades were applied. This audit is not a security guarantee.
