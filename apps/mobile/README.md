# FOILHOUSE Riders mobile app

Early Android and iPhone app project built with Expo SDK 58 and React Native.

## First version

- Native 2027 calendar, event search, region filters, device-local favorites and the system share sheet.
- Bundled calendar plus a cached copy for offline browsing; refreshes from the live site's events file when online.
- Bottom navigation to Map, Forum, Photos and Profile. These sections currently use the existing live community in an embedded WebView, including its Supabase sign-in and uploads. This is a hybrid first version, not a complete native rewrite.
- Persistent website session storage, Android back navigation, external links opened outside the app, loading/error recovery, and a Jackson Lake-only lesson notice.
- Share links strip authentication parameters. Device-local favorites are separate from the website's browser-local favorites.

No new database, paid service, app-store account, or production website deployment was created by adding this project. App data uses the existing community service.

## Run on a phone

From this directory:

```sh
npm ci
npx expo start
```

Use Expo Go compatible with SDK 58, or create a development build. A running local development server and a reachable network connection are required for Expo Go. Sign in to the community inside the app; browser sessions are separate from the app's WebView session.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform android --platform ios --output-dir dist-check
```

TypeScript, lint, link-safety tests and both JavaScript bundle exports are the required source checks. No physical Android/iPhone or emulator runtime test has been completed yet; native upload chooser permissions, cookies, gesture handling and external email flows still need device verification. Exported JavaScript bundles are not signed APK/AAB/IPA installers.

## Create installation builds

Install the official EAS CLI, sign into the company's Expo account, then run:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --platform android --profile preview
```

The preview profile produces an Android APK for internal testing. Do not start a billed cloud build without reviewing the account's plan and any displayed cost.

For an iOS simulator:

```sh
npx eas-cli@latest build --platform ios --profile simulator
```

For physical iPhones, configure the Apple Developer team and registered test devices, or prepare TestFlight distribution. EAS will request credentials and provisioning details. Those steps must be completed with the account owner. Android and Apple identifiers are currently `com.foilhousehq.riders`; confirm ownership/availability before the first signed release.

## Before store submission

This project is an initial device-test version, not a store submission. Complete physical-device QA, final app icon/splash, public privacy/support pages and account-deletion flow, app privacy/data-safety disclosures, moderation/support review, accessibility checks, signed releases, store listings and screenshots. Review Apple's minimum-functionality requirements and Google's current policies before submission; approval has not been established. The supplied icon uses the existing FOILHOUSE logo and is a first-build asset.
