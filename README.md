# FOILHOUSE Riders

Public website: https://foilhousehq.github.io/foilhouse-riders/

Calendar, worldwide opt-in foiler map, rider directory, discussions, photo albums, lesson/demo requests, and private HQ tools. Original FOILHOUSE HQ, Air Chair, Sky Ski, Hyperlite assets and event flyer are preserved.

## Development

Run `npm run install:source`, then `npm --prefix source run dev`. Run `npm run build` to build and copy the production files to the repository root, then `npm test`. Commit both source and production output. GitHub Pages serves `main` from the repository root; no Netlify account is required.

## Supabase

Project: `oogizjynlhjmtybxayjq`. Frontend configuration is in `source/lib/api.ts`; only the public publishable key is present. API source is archived in `source/supabase/functions/riders-api/index.ts`. The existing hosted function is `riders-api`; service-role credentials stay in Supabase.

Rider accounts use Supabase email/password authentication. Confirm the Supabase Auth redirect allowlist includes `https://foilhousehq.github.io/foilhouse-riders/rider-login/` and its `?mode=update` reset URL before testing confirmation/reset emails. Existing email templates pointing to the original website require updating for the new public site. Do not remove existing redirects while the original site remains in use.

All nine `fh_` tables have row-level security enabled. Map visibility is opt-in, and the API rounds published coordinates to 0.1 degree. Rider photos use a private storage bucket and are served only while their owner's profile is published. Inquiry contact details are returned only to HQ.

## Verification

Production build and migration tests check all 13 events, nested Pages routes, worldwide city files, exact asset checksums, and the public key/API adapter. Anonymous API reads return no private inquiry details. An actual account confirmation/password reset and signed-in publishing session require end-to-end verification. This repository contains the website foundation; native iOS/Android apps are separate future work.
