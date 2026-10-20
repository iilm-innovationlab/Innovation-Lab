## Existing database migration notice

If this project is already connected to Supabase, **do not rerun the full `supabase/schema.sql` just to apply these updates**. Back up the database first. For an existing database, run `supabase/migrations/20261010_single_admin_role_profile.sql` if the single-admin-role change has not already been applied, then run `supabase/migrations/20261010_team_onboarding_profile_pictures.sql`, followed by `supabase/migrations/20261010_resource_usage_guardrails.sql`. The photo/archive migration adds application photo/archive metadata, clears obsolete generated Team IDs, and removes admin authorization from legacy Auth users that were linked to generated Team IDs. The guardrails migration adds an atomic database-backed rate limiter for public application submissions and Cloudinary upload-signature requests. These migrations do not delete Auth users, applications, team profiles, or historical audit rows.

# IILM × BNV Innovation Lab — Complete Setup & Production Runbook

This is the single setup guide for this repository. Follow it in order, from a clean download to a tested production deployment. It documents the intended architecture and operational checks; **a checklist is not proof that every feature is production-safe**. Do not launch until you have completed the tests in Section 13.

## 1. What you are deploying

- **Application:** Next.js + React website, deployed to Vercel.
- **Database and authentication:** Supabase Postgres and Supabase Auth. Database access must be protected by Row Level Security (RLS).
- **Media:** Cloudinary for uploaded images where the upload flow is implemented; YouTube for video/Shorts. Store URLs and metadata in Postgres, not media files.
- **Forms:** Official Google Form URLs are configured with environment variables when supplied. Do not invent missing form URLs or application questions.
- **Notifications:** Optional Web Push using VAPID and a Supabase Edge Function. Configure and test it separately before enabling it.
- **Caching:** Public content should be cached/revalidated. Do not add frequent polling or Socket.IO without a documented need.

### Important production limits

- This repository is not automatically production-ready just because it builds or deploys. You are responsible for verifying permissions, forms, content, accessibility, backups, and all user journeys.
- A successful build proves compilation, not that Supabase policies or business workflows are secure.
- Keep production secrets out of Git, browser code, screenshots, chat messages, and client-side environment variables.
- Do not use demo mode or a demo admin password in production.
- Do not create real user accounts until you have permission to manage the institution's website and student data.


## 1A. Free-tier and payload optimization (October 2026)

The source is configured to reduce repeat work, but no code can guarantee that a project will never exceed a provider quota. Actual use depends on visitors, browser cache hit rate, image requests, form spam, admin activity, and content size. Check the provider dashboards after deployment.

### Changes made for this package

- Re-encoded the four campus photos as smaller WebP files sized for the site's display dimensions. The original large JPEG versions were removed.
- Converted the two cropped header/footer logos to WebP and removed unused full-size PNG logo variants. The app icon remains PNG and the social-sharing image remains JPEG for compatibility.
- The campus and local logo images use `unoptimized` because these files are already pre-sized/compressed. This avoids unnecessary Vercel Image Optimization transformations for those static assets. Remote team photos are served through one standardized Cloudinary `f_auto,q_auto,w_480,h_480,c_fill,g_auto` rendition so browsers do not download full-size originals. The same rendition is reused across the homepage, team page, and admin thumbnails to avoid creating multiple transformed variants per photo.
- Public homepage data is cached and revalidated: homepage, events and announcements every 10 minutes, team/Shorts every 10 minutes, and community counts every 15 minutes. Updates normally appear within the relevant revalidation window; explicit path revalidation is used by team onboarding where supported.
- No polling, Socket.IO, or Realtime subscription was added. Admin writes happen only when an admin takes an action.
- Removed generated TypeScript build cache from the package. It is recreated when needed.

### Provider quotas to watch

- **Vercel Hobby:** the official plan currently lists 100 GB Fast Data Transfer, 1 million Function Invocations, and 1,000 Image Optimization source images as included usage. The Hobby plan is restricted to personal, non-commercial use; because this is an institutional website, confirm with the institution and Vercel that the intended use is permitted before relying on Hobby for production. Do not treat this limit table as a permanent guarantee. See [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel limits](https://vercel.com/docs/limits), and [fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines).
- **Supabase Free:** currently lists a 500 MB database-size quota per project, 1 GB file storage, and 50,000 monthly active users. Free-plan bandwidth is described as 5 GB cached plus 5 GB uncached in the bandwidth docs; check the Supabase dashboard because quota definitions and plan details can change. See [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [bandwidth and egress](https://supabase.com/docs/guides/storage/serving/bandwidth), and [database size](https://supabase.com/docs/guides/platform/database-size).
- Public data queries select only needed columns, use row limits, and rely on Next.js data caching. The team page is cached for 10 minutes. The admin dashboard loads its tables once per authenticated identity instead of refetching all five tables every time the admin switches tabs, and the applications query selects only fields used by the interface. Public application submissions and Cloudinary signature requests use an atomic database-backed per-IP rate limit. Keep uploaded media in Cloudinary rather than Supabase database rows or Supabase Storage unless there is a specific reason.
- **Cloudinary Free:** currently uses a shared 25-credit monthly allowance across image bandwidth, storage, and transformations. One credit corresponds to 1 GB of image bandwidth, 1 GB of storage, or 1,000 transformations, but these consume the same shared pool. Profile-photo transformations are standardized to one 480×480 rendition to avoid creating multiple sizes. See [Cloudinary billing](https://cloudinary.com/documentation/billing_and_plans). Cloudinary describes free-plan limits as soft limits, so monitor usage and configure account-level usage limits where available.
- **Netlify:** this project is configured for Vercel, not Netlify. Netlify usage does not apply unless you separately deploy the site there. Avoid running duplicate production deployments unless there is a clear reason.
- **Capacity sanity check (not a guarantee):** 10,000 visitors transferring an average of 2 MB each would use about 20 GB of Vercel data transfer; at 5 MB each it would use about 50 GB. Measure the actual first-visit transfer with browser DevTools after deployment. For Cloudinary, 10,000 visits each downloading five 100 KB profile-photo renditions would deliver about 5 GB of image bandwidth before caching effects, or roughly 5 credits for bandwidth alone. Actual photo sizes and how often visitors reach those sections matter. Supabase Auth's monthly active-user allowance counts authenticated users, not every anonymous public website visitor; Supabase egress is driven by data returned by its APIs and other Supabase services.
- **No quota guarantee:** these optimizations make 5,000–10,000 monthly visitors a plausible target for this small, cached site, but cannot guarantee that all quotas will never be crossed. Bot traffic, large payloads, unexpectedly high photo views, cache misses, or external hotlinking can change usage. Review Vercel transfer/function usage, Supabase egress/database size, and Cloudinary credit usage weekly during launch, then monthly. Do not treat a free-tier threshold as a security boundary. Vercel Hobby is documented for personal, non-commercial use; confirm that an institutional deployment is permitted before production use.
- Supabase Free projects can be paused after inactivity; do not assume they provide production uptime guarantees. Review current plan behavior before launch.

### How to verify the payload

Run these commands from the project root after installing dependencies:

```bash
# Source package size, excluding dependencies and generated build output
du -sh . --exclude=node_modules --exclude=.next

# Static image asset total
du -ch public/* | tail -n 1

# Production build and route report
npm ci
npm run build
```

Then use browser DevTools → Network with cache disabled for the first visit and with cache enabled for a repeat visit. Record transferred bytes for the homepage and one inner page separately. A ZIP size is not the same as browser transfer size, and the full source repository is not what visitors download. The 500 KB target should be applied to the initial page's transferred assets, not blindly to the source folder; fonts, JavaScript chunks, CSS, and any third-party embeds must be measured in the production build.

Do not remove meaningful content, security checks, application fields, or admin features just to hit a ZIP-size number. If the first-view transfer exceeds the target, inspect the actual Network waterfall and optimize the largest transferred resources first.

## 2. Prerequisites

Create accounts with the appropriate owner/organization email:

1. GitHub — private repository for source code.
2. Vercel — hosting and deployment.
3. Supabase — database and authentication.
4. Cloudinary — only if the site's image-upload feature needs it.
5. Domain provider / institution IT — only if connecting a custom domain.

Install a supported Node.js LTS version (Node.js 20 or newer is the baseline) and npm. Check:

```bash
node --version
npm --version
git --version
```

Use the Node version supported by the Next.js version installed in `package.json`; check the current Next.js compatibility requirements if upgrading dependencies.

## 3. Extract the project and run it locally

1. Extract the ZIP into a normal project folder.
2. Open a terminal in that folder (the folder containing `package.json`).
3. Create your local environment file from the example:

```bash
# A starter .env.local is included for local testing. If it is missing, create it with:
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
# The ZIP contains .env.example, not a populated local environment file. Create your local file with:
Copy-Item .env.example .env.local
```

4. Open `.env.local` in your editor. The `.env.example` template sets `NEXT_PUBLIC_SITE_URL` to `http://localhost:3000` and leaves backend credentials blank. Add your own Supabase project URL and anon key to enable real backend features. Add server-only keys only when you specifically need those features. Never commit or share a populated `.env.local`.
5. Install dependencies and start the development server:

```bash
npm install
npm run dev
```

6. Open `http://localhost:3000`.

For a reproducible install after a `package-lock.json` exists in the repository, use `npm ci`. If the repository does not contain `package-lock.json`, `npm ci` will fail; run `npm install` once, review the generated lockfile, and commit it. For production CI, commit the lockfile and use `npm ci`.

### Useful commands

```bash
npm run dev       # local development
npm run build     # production compilation
npm run start     # serve a completed production build locally
```

Before using `npm run start`, run `npm run build` successfully.

## 4. Environment variables

Use `.env.local` locally and Vercel Project → Settings → Environment Variables for hosted deployments. The ZIP contains `.env.example`, not `.env.local`; copy the template and enter your own project values. It does not sign you in automatically and cannot connect to Supabase until configured. Do not commit or distribute a populated `.env.local`. `.env.example` remains the shareable template.

### Public variables

These are intentionally readable by the browser because their names begin with `NEXT_PUBLIC_`. Only put public values here.

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical website origin, metadata and sitemap. Use the final HTTPS domain in production. |
| `NEXT_PUBLIC_SUPABASE_URL` | When using Supabase | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | When using Supabase | Browser/public key. Safe only when RLS and policies are correctly configured. |
| `NEXT_PUBLIC_EXPLORER_FORM_URL` | Optional until official URL is approved | Official Explorer application form. |
| `NEXT_PUBLIC_IDEATOR_FORM_URL` | Optional until official URL is approved | Official Ideator application form. |
| `NEXT_PUBLIC_CAMPUS_INNOVATION_FORM_URL` | Optional until official URL is approved | Official Campus Innovation Fellow form. |
| `NEXT_PUBLIC_SOCIAL_MEDIA_FORM_URL` | Optional until official URL is approved | Official Social Media Team form. |
| `NEXT_PUBLIC_EXPLORER_WHATSAPP_URL` | Optional | Approved Explorer contact link. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional | Google Search Console verification token. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional | Bing Webmaster verification token. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Only for Web Push | Public half of the VAPID key pair. |

### Server-only secrets

| Variable | Required? | Rules |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Only for server operations that require it | Highly privileged. Never prefix with `NEXT_PUBLIC_`; never use in browser code. |
| `CLOUDINARY_CLOUD_NAME` | If Cloudinary is enabled | Cloud name; normally not secret, but configure server-side as required by the implementation. |
| `CLOUDINARY_API_KEY` | Required for signed Cloudinary uploads | Used by the server to create upload signatures and returned to the browser with the signature. |
| `CLOUDINARY_API_SECRET` | Required for signed Cloudinary uploads | Secret; server-side only. Never return it to the browser. |

For Web Push, set `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` as **Supabase Edge Function secrets** if that is how the function is implemented. Do not expose the private key to the browser.

### Environment file rules

- `.env.local` is for your machine and must not be committed.
- `.env.example` is a template, not a place for real credentials.
- In Vercel, configure Preview and Production separately. Use a test Supabase project for Preview where possible.
- After changing Vercel environment variables, redeploy the affected environment.
- If a secret was ever committed, shared publicly, or included in a ZIP sent to others, rotate it. Deleting the file in a later commit does not remove it from Git history.

## 5. Set up Supabase

### 5.1 Create the project

1. Create a Supabase project under the organization that will own the website.
2. Save the database password in a trusted password manager.
3. Choose a region suitable for the intended audience and institutional requirements.
4. In Project Settings → API, copy the Project URL and the public/anon key into `.env.local` and later into Vercel.
5. Keep the service-role key private. Do not use it in client components or browser requests.

### 5.2 Apply the schema

1. Open Supabase → SQL Editor.
2. Open `supabase/schema.sql` from this repository.
3. Review it, then run the full script in the correct project.
4. Confirm the expected tables and policies exist.
5. Review Supabase → Database → Advisors / Security Advisor and resolve relevant errors before launch.

If this project already has a database, take a backup first. Do not rerun the full schema to update an existing project. Apply the single-role migration if needed, then apply `supabase/migrations/20261010_team_onboarding_profile_pictures.sql`. Do not assume a `CREATE TABLE IF NOT EXISTS` script updates every existing column or constraint. Test migrations in a non-production project first.

Application detail rendering now displays the saved `payload` fields as readable answers, preserves multiline text, and captures the originally submitted stage in `payload.submitted_stage` for new submissions. No database migration is needed for that JSON field. Existing records display all fields that were actually stored; an answer that was never submitted or was overwritten before this change cannot be reconstructed.

Team onboarding now creates only a public `team_members` profile. It does **not** create or modify a Supabase Auth user, generate a Team ID, display a password, or grant admin authorization. To create a sign-in account, do it manually in Supabase Authentication. A new Auth user remains unauthorized by default; do not set its profile role to `admin` unless that person is intentionally an administrator. The public team profile and Auth account are separate unless you deliberately implement a verified linking workflow.

For the Applications detail panel, make sure the `review_notes` column exists. If this database was created before this update, run this safe migration in Supabase SQL Editor:

```sql
alter table public.applications add column if not exists review_notes text;
```

### 5.3 Authentication and accounts

1. In Supabase Authentication settings, enable the intended sign-in provider (normally email/password for the current admin workflow).
2. Configure the production site URL and approved redirect URLs under Authentication → URL Configuration.
3. Keep email confirmation enabled for production unless the institution has explicitly approved another workflow.
4. Create individual accounts for the people who need admin access. Do not share one team password.
5. Verify each new account receives the correct `public.profiles` row.
6. After adding an account, explicitly authorize only the intended people as admins. The `on_auth_user_created` trigger creates a profile with `role = NULL`; it does not grant admin access automatically.

To authorize a newly created account, copy its exact UUID from **Authentication → Users**. In **Table Editor → profiles**, find the row whose `id` exactly matches that UUID and set `role` to `admin` and `full_name` to the person's real display name. Alternatively, run the targeted SQL below only after verifying the UUID:

```sql
update public.profiles
set role = 'admin',
    full_name = 'REPLACE WITH APPROVED FULL NAME',
    updated_at = now()
where id = 'REPLACE_WITH_VERIFIED_AUTH_USER_UUID';
```

Verify exactly one row was updated. If zero rows changed, stop and check that the profile exists and the UUID matches. Do not authorize users by email domain or signup order. The only authorization role is `admin`; a NULL role means the Auth account is not authorized for Admin Studio.

### 5.4 RLS and authorization verification

RLS is mandatory. Before production:

- Confirm RLS is enabled on every table reachable by an API role.
- Review every `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policy in `supabase/schema.sql`.
- Test with an unauthenticated client, an unapproved Auth account (role is NULL), and an authorized admin.
- Confirm anonymous visitors can read only intentionally published public content.
- Confirm anonymous users cannot read applications, private profile data, unpublished content, or notification subscriptions.
- Confirm users cannot promote themselves, change their own role, impersonate another actor in audit fields, or bypass restrictions by calling the API directly.
- Confirm application submissions use a protected, validated server-side path or an appropriately restricted policy. Do not assume a hidden form or hidden admin button is security.
- Confirm account creation, role changes, and team-member creation are restricted on the server, not merely hidden in the UI.

If any test fails, do not launch until the policy or server authorization is fixed and retested.

## Application profile pictures and onboarding archive

The Campus Innovation Fellow and Social Media forms accept an **optional** JPG, PNG, or WebP profile picture up to 5 MB. The photo upload workflow is deliberately separate from application JSON:

1. The browser checks the selected file type and 5 MB size limit. The preview is temporary and is not submitted as a base64/data URL.
2. The browser requests a short-lived signed upload configuration from Vercel. The server creates the signature; the API secret never leaves the server.
3. The browser uploads the image file **directly to Cloudinary** in `iilm-bnv/applications`. The image bytes do not pass through a Vercel function.
4. Cloudinary returns a secure HTTPS URL. The browser submits that URL with the application text fields, and the server validates the Cloudinary host/folder before storing it in `applications.profile_picture_url`.
5. The admin panel reads the URL from Supabase and loads the image directly from Cloudinary. When an authorized admin adds the applicant to the team, the same Cloudinary URL is copied to `team_members.photo_url`; the image is not uploaded to Supabase again.

**Storage rule:** Supabase stores the URL and normal application metadata only. No uploaded photo binary, data URL, or base64 image is written to Supabase tables or Supabase Storage. Vercel handles only the small signature request and application metadata request; it does not receive the photo file. Images are stored and delivered by Cloudinary. This keeps photo-upload bandwidth and file bytes off Vercel, although normal page/API usage still counts toward Vercel usage.

**Deletion cleanup:** Admin team-member deletion now checks whether the stored Cloudinary image URL is still referenced by another active team member, non-archived application, Star Ideator, event, or YouTube Shorts thumbnail before deleting the asset through Cloudinary's signed server-side API. If reference checks fail, the image is retained rather than risking deletion of a still-used asset. Cloudinary cleanup errors are logged and surfaced in the existing admin notification. A protected `DELETE /api/admin/applications` endpoint applies the same cleanup to application deletion workflows; this update intentionally does not add or change any delete controls in the UI. Deleting rows directly from the Supabase dashboard does not invoke these application API cleanup handlers.

Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` as server-side environment variables in local `.env.local` and in Vercel. Without these variables, submissions without a photo still work; a submission that includes a photo receives a configuration error. Never add the API secret to a `NEXT_PUBLIC_` variable or client component.

After submission, the admin application details display the Cloudinary image. When an authorized admin selects **Add to team & archive**, the server creates the roster profile using the stored URL, marks the application accepted, fills archive metadata, and removes it from the active application list while preserving the original application and audit history. No Auth user or credentials are generated. Manual team profile creation also sends any selected photo to Cloudinary and stores only the resulting URL.

## 6. Configure application forms and content

The public site has separate application journeys for Explorer, Ideator, Campus Innovation Fellow, and Social Media. Use only institution-approved form URLs and application questions.

1. Obtain the official form URLs and the approved form owner.
2. Add each URL to the matching variable in `.env.local`.
3. Test every CTA from desktop and mobile.
4. Confirm the form accepts a test submission and that the responsible team can access the response.
5. Confirm the privacy notice explains what data is collected, why, who can access it, and how long it is retained.
6. Remove test submissions before launch if appropriate.

Do not publish placeholder testimonials, unverified team details, invented event information, or made-up form URLs. Review all public copy, links, dates, names, photographs, and institutional branding with the authorized owner.

## 7. Configure Cloudinary for all user-uploaded photos

Cloudinary is the only image-storage destination for photos uploaded through application forms or the admin team-profile form. The application does not use Supabase Storage for these photos.

### 7.1 Configure the Cloudinary account

1. Create or open the Cloudinary account owned by the Innovation Lab/organization.
2. In the Cloudinary Console, find the cloud name, API key, and API secret.
3. In the project root, copy `.env.example` to `.env.local` for local development and fill in the three `CLOUDINARY_*` values. Keep `.env.local` out of Git.
4. In Vercel, open **Project → Settings → Environment Variables** and add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` separately for Preview and Production as needed. These are server-only variables: do not prefix them with `NEXT_PUBLIC_`.
5. Redeploy after adding or changing Vercel environment variables.

### 7.2 What gets stored where

| System | Stored | Not stored |
|---|---|---|
| Cloudinary | Uploaded image files and their delivery URLs | Supabase application records |
| Supabase Postgres | Application answers and `profile_picture_url` / `photo_url` HTTPS URL strings | Photo binaries, data URLs, or base64 image contents |
| Vercel | Website code and short-lived request processing | Permanent copies of uploaded profile photos |
| Browser | A temporary preview while the student is filling the form | A permanent copy uploaded to Supabase |

### 7.3 Test the complete flow

1. Submit a test Campus Innovation Fellow application with a small JPG/PNG/WebP profile photo.
2. In browser DevTools → Network, confirm the image bytes are sent to `api.cloudinary.com`, not to a Vercel `/api/...` endpoint. The Vercel signature request should contain only a small JSON purpose value.
3. In Cloudinary Media Library, confirm the asset appears under `iilm-bnv/applications`.
4. In Supabase Table Editor, inspect the application row. Confirm `profile_picture_url` contains an HTTPS Cloudinary URL and the application `payload` contains no image data. Do not upload or paste the image itself into Supabase.
5. Open the application in Admin Studio and confirm the image loads from Cloudinary.
6. Use **Add to team & archive**. Confirm the active application disappears, its row remains with archive metadata, and `team_members.photo_url` contains the same Cloudinary URL.
7. Confirm the public team page displays the photo from Cloudinary.
8. Repeat with the Social Media form, then submit an application without a photo to confirm pictures remain optional.
9. Test a file larger than 5 MB and a non-image file; the UI should reject them before upload, and Cloudinary's signed allowed-format parameter also rejects unsupported formats. Configure and monitor Cloudinary account usage limits.

The site also contains a small set of bundled static branding/campus assets in `public/` (logos, icons, campus photos, and the social preview image). Those are design assets included with the website, not student-uploaded application photos. The Cloudinary-only workflow described here applies to all user-uploaded photos. If the organization later wants those bundled design assets moved to Cloudinary too, upload/replace them as a separate asset migration; do not delete the local originals until the remote URLs have been verified.

Cloudinary usage has its own storage, transformation, and bandwidth limits. Check the account's plan and usage dashboard periodically. Never expose the API secret to make a browser upload work; the server signs the upload, while the browser sends the file directly to Cloudinary. The 5 MB file-size limit is enforced in the application UI; it is not a substitute for Cloudinary account-level usage controls. Profile photos are displayed using one standardized 480×480 automatic-format/quality Cloudinary rendition. The original is retained in Cloudinary, but the website should load the transformed URL rather than the original for ordinary display. The public signature endpoint is rate-limited to 20 application-photo signatures per IP per hour; team-photo signatures are limited to 30 per IP per hour, and application submissions to 10 per IP per hour. Each signature is bound to a unique non-overwritable public ID so the same signature cannot repeatedly create new assets. These controls reduce abuse but are not a guarantee against distributed attacks. In Cloudinary Console, review Account Settings → Usage Limits and set the maximum upload file size to 5 MB if the account exposes that control; the browser validation alone can be bypassed by a custom client. Also monitor Cloudinary and Supabase usage dashboards.

## 8. Optional Web Push notifications

Do this only after the main website and admin authorization have passed testing.

1. Generate a VAPID key pair with a trusted tool.
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in the frontend environment.
3. Set `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, and `VAPID_PRIVATE_KEY` as Supabase Edge Function secrets.
4. Apply any required schema from `supabase/schema.sql`.
5. Deploy the function:

```bash
supabase functions deploy send-notification
```

6. Verify the function's authorization checks before enabling admin-triggered sends.
7. Test subscription, permission denial, unsubscribe, invalid subscriptions, and delivery on supported HTTPS browsers.

Do not send push notifications to people who have not opted in. Never put the VAPID private key in Vercel's public variables or frontend code. If notifications are not needed for launch, leave them disabled.

## 9. GitHub: safe source control

1. Create a **private** GitHub repository under the organization/owner that should retain the code.
2. Before the first commit, check that `.env.local`, `.env`, build output, database exports, and credentials are not staged.
3. Commit the source code and `.env.example`, not real secrets.
4. Commit `package-lock.json` after running `npm install`, so installs can be reproduced.
5. Use a protected production branch and review changes through pull requests when more than one person works on the site.

Useful checks:

```bash
git status --short
git check-ignore .env.local
git ls-files .env .env.local
```

The last command should print nothing. If either environment file is tracked, untrack it and rotate any real credentials that were committed. A private repository is not a substitute for secret management.

## 10. Deploy to Vercel

### 10.1 Preview deployment

1. Push the project to the private GitHub repository.
2. In Vercel, import the repository.
3. Select the Next.js framework preset.
4. Use the repository's normal install/build commands. The build command is `npm run build`.
5. Configure all required environment variables for **Preview**. Prefer a separate test Supabase project.
6. Deploy the preview.
7. Test public pages, forms, login, permissions, media, and mobile layout on the preview URL.

### 10.2 Production deployment

1. Confirm the preview test checklist in Section 13 passes.
2. Configure **Production** environment variables using the production Supabase project and approved URLs.
3. Set `NEXT_PUBLIC_SITE_URL` to the final canonical HTTPS origin.
4. Do not enable demo authentication. Admin access always requires a real Supabase Auth account with an authorized profile.
5. Deploy the production branch.
6. Add the custom domain in Vercel and follow the DNS instructions from Vercel and the domain owner.
7. Confirm HTTPS works and the canonical URL, metadata, robots rules, and sitemap use the production domain.
8. After changing environment variables or domain settings, redeploy if required.

Do not point a public institutional domain at the site until the institution has approved ownership, content, data handling, and operational responsibility.

## 11. SEO, accessibility, performance and reliability

Before launch:

- Check page titles, descriptions, canonical URLs, Open Graph metadata, sitemap, and robots output.
- Verify every public page has a meaningful title and heading structure.
- Test keyboard navigation, visible focus, form labels, validation messages, color contrast, reduced-motion preferences, and mobile screen-reader basics.
- Compress and size images appropriately; use video embeds thoughtfully and avoid unnecessary autoplay.
- Check for console errors, broken links, missing images, hydration warnings, and failed requests.
- Test on a real Android phone and a desktop browser, plus at least one additional mobile browser.
- Run Lighthouse or an equivalent audit on key public pages. Treat scores as diagnostic, not as a guarantee of accessibility or production readiness.
- Confirm error pages do not reveal secrets, stack traces, or private data.
- Confirm caching and revalidation behave as expected after publishing or unpublishing content.
- Do not introduce aggressive polling to make updates appear instant. Use the existing revalidation approach unless a measured requirement justifies a change.

## 12. Backups, incident response and maintenance

### Backups

- Export a JSON backup through the admin interface if that feature is available and tested.
- Store at least two encrypted copies in separate, approved locations.
- Test restoring a backup into a staging/test database before relying on it.
- Confirm backup exports exclude passwords, auth tokens, private keys, and other secrets.
- Review the Supabase plan's database backup and recovery capabilities. Application exports are not equivalent to point-in-time recovery.
- Establish who is responsible for backup cadence, retention, access, and restoration.

### Maintenance

- Monitor Vercel deployment logs and Supabase database/auth usage.
- Review security advisories and dependency updates regularly.
- Apply changes to a preview environment first.
- Keep a record of deployments, migrations, and rollback steps.
- Remove accounts promptly when staff leave or no longer need access.
- Rotate credentials after staff changes or suspected exposure.
- If a secret is exposed: revoke/rotate it immediately, inspect logs and repository history, redeploy, and document the incident.

## 13. Final go-live checklist

Do not call the deployment production-ready until each applicable item is checked.

### Build and deployment
- [ ] `npm install` completes without errors.
- [ ] `npm run build` completes successfully locally and on Vercel.
- [ ] A lockfile is committed and CI uses `npm ci`.
- [ ] Preview and production use the correct, separate environment variables.
- [ ] HTTPS, custom domain, canonical URL, sitemap, and robots output are correct.

### Public experience
- [ ] Every public route loads on desktop and mobile.
- [ ] All navigation, CTA, application links, event links, and external links work.
- [ ] Official forms accept test submissions and the correct team receives them.
- [ ] Content, testimonials, team names, photos, and event details are approved and accurate.
- [ ] Empty, loading, error, and success states are understandable.
- [ ] No broken images, browser console errors, or hydration warnings remain.

### Admin and data
- [ ] Real Supabase login works; no demo authentication or sample records remain.
- [ ] Logout and expired-session handling work.
- [ ] An unapproved Auth account and an authorized admin are tested through direct API attempts, not just the UI.
- [ ] RLS is enabled and tested on every exposed table.
- [ ] Unpublished and private data is inaccessible to anonymous visitors.
- [ ] Application submissions are validated and protected from abuse.
- [ ] Audit fields identify the authenticated actor and cannot be forged by the browser.
- [ ] Backup export and restore have been tested on non-production data.

### Security and operations
- [ ] `git ls-files .env .env.local` returns no tracked environment files.
- [ ] No service-role key, Cloudinary API secret, VAPID private key, or real password is present in the client bundle or repository.
- [ ] Image bytes travel directly from the browser to Cloudinary; Vercel receives only the upload-signature request and the resulting URL.
- [ ] No demo credentials or demo authentication paths exist in the deployed app.
- [ ] Supabase Security Advisor and Vercel logs have been reviewed.
- [ ] MFA is enabled for owner accounts.
- [ ] A named person is responsible for backups, access removal, incident response, and updates.
- [ ] If Web Push is enabled, opt-in, unsubscribe, authorization, and delivery have been tested.

## 14. Troubleshooting

**`npm ci` fails:** ensure `package-lock.json` exists and matches `package.json`. Run `npm install`, inspect the changes, commit the lockfile, then retry `npm ci`.

**Build fails:** read the first meaningful TypeScript/Next.js error, fix it locally, and rerun `npm run build`. Do not ignore a build failure or assume Vercel will fix it.

**Supabase data is missing:** verify the project URL/key, schema, table names, RLS policies, and whether the content is published. Never “fix” missing data by disabling RLS.

**Admin login succeeds but permissions are wrong:** verify the matching `public.profiles` row and role, then inspect server-side authorization and RLS policies. Do not rely on client-side role state.

**Changes do not appear immediately:** check the configured revalidation/cache path and deployment status. Do not add frequent polling as a quick workaround.

**Images do not upload:** confirm the Cloudinary cloud name, API key, and API secret are set in local `.env.local` or Vercel's server-side environment, apply the `20261010_resource_usage_guardrails.sql` migration, redeploy after environment changes, and inspect the browser Network panel for the signature response and direct Cloudinary upload error. The file upload should go to `api.cloudinary.com`, not through a Vercel API route. Never expose the API secret to make the browser upload work.

**Form link does not work:** verify the official URL, the corresponding environment variable, and whether the component uses that variable. Do not substitute a fabricated URL.

## 15. Recommended order from 0% to launch

1. Extract the project and create `.env.local`.
2. Run locally and review the whole site.
3. Create a private GitHub repository and commit a lockfile.
4. Create Supabase, apply and review the schema, configure Auth, and test RLS.
5. Configure approved form URLs and real content.
6. Deploy to Vercel Preview with test credentials/data.
7. Run all checks in Section 13 and fix failures.
8. Configure production environment variables and domain.
9. Deploy production only after institutional approval.
10. Monitor logs and usage, maintain backups, and periodically re-test access controls.

**Production status:** This guide provides the deployment procedure and acceptance criteria. It does not certify that the current source code has passed the build, penetration testing, privacy review, or every functional test. Record actual test results before describing the site as production-ready.


## One admin role, editable names, and audit history

There is one admin route (`/admin`) and one authorization role (`admin`). The separate `super_admin` and `team_member` authorization roles and Admin Management section have been removed. A person's public team roster entry (`public.team_members`) is content; it is not a separate login role.

### Applying the incremental migration

For an existing database, back up first, then run `supabase/migrations/20261010_single_admin_role_profile.sql` in Supabase SQL Editor. Do not rerun the full schema for this role change. The migration:

- Converts existing profiles with `super_admin`, `admin`, or `team_member` roles to `admin` as part of the single-role conversion.
- Leaves new or otherwise unapproved Auth profiles with `role = NULL` until explicitly authorized.
- Updates RLS authorization helpers so only `role = 'admin'` can access private admin data.
- Preserves existing users, content rows, and audit history.
- Keeps profile role updates out of the browser. Users can change only their display name through the protected server endpoint.

Then apply `supabase/migrations/20261010_team_onboarding_profile_pictures.sql` to an existing database. It adds optional profile-picture and archive metadata; clears obsolete generated Team IDs; and removes admin authorization from legacy Auth users linked to those generated IDs. Review the affected legacy accounts after migration. No Auth user is deleted. Finally, apply `supabase/migrations/20261010_resource_usage_guardrails.sql` to install the request-rate-limit table and restricted RPC used by the public application and Cloudinary-signature endpoints. The raw client IP is not stored; only a SHA-256 hash scoped with a server secret is stored temporarily, with stale entries opportunistically cleaned up.

### Adding an admin account

1. In Supabase, open **Authentication → Users → Add user** and create the person's email/password account.
2. Copy the new user's UUID from Authentication → Users.
3. In **Table Editor → profiles**, locate the row with the exact same `id`. Set `role` to `admin` and set `full_name` to the person's real name. If the profile row is missing, stop and check the Auth profile trigger rather than inserting a guessed ID.
4. Sign in at `/admin` using that person's email/password.
5. Open **Settings → Profile** to edit the display name later. The account email is read-only in the profile form, and the role cannot be changed there.

Adding an Auth user alone does not grant access. This explicit authorization step prevents unrelated or public Auth accounts from becoming administrators. The Add to Team workflow only creates a public team profile and archives the application; it never creates or authorizes an Auth account.

### Activity log

Open **Admin Studio → Activity log** to review the actor name, action, module, changed fields, before/after values where available, and timestamp. Database triggers record changes to tracked content tables; the profile-name API records the old and new name. Audit records created before the audit system was installed cannot be reconstructed retroactively. Keep the audit table protected from client-side insert/update/delete operations.

### Server environment

Set `SUPABASE_SERVICE_ROLE_KEY` in local `.env.local` and Vercel's server-only environment variables. Never prefix it with `NEXT_PUBLIC_`, import it into a client component, or commit/share it. The protected profile and onboarding APIs use this key only on the server after verifying the caller's Supabase Auth token and matching profile role.

### Troubleshooting: the wrong name or role appears after login

The Admin Studio must look up `public.profiles` by the exact UUID returned by Supabase Auth (`id=eq.<authenticated-user-id>`). Never use an unfiltered `select ... limit=1` profile query: it can return another user's profile and display that person's name or role. The current client code now requires the profile ID to match the authenticated user ID exactly.

If an old session is already open after updating the code:

1. Click **Log out** in Admin Studio.
2. If the login page does not appear, open browser DevTools → Application/Storage → Local Storage for your local site and delete only the `iilm-admin-session` entry. Do not delete Supabase database users or team records.
3. Reload `/admin` and sign in using the email/password for the exact Supabase Auth user you promoted.
4. In Supabase Authentication → Users, verify that the email and UUID match the account you intended to promote. In SQL Editor, verify that `public.profiles.id` equals that UUID and `role` is `admin`.
5. If the authenticated user has no matching profile row, stop and fix the profile provisioning. Do not promote a different account as a workaround.

The UI's displayed name and role are loaded from the profile row whose ID matches the Auth user. A role change affects authorization only for the account matching that UUID. This code change does not modify database users, passwords, profile roles, or application records.



## Star Ideators feature

Before using the Star Ideators tab, apply `supabase/migrations/20261010_star_ideators.sql` in the Supabase SQL Editor (or run the additive SQL from the end of `supabase/schema.sql`). This creates the `star_ideators` table, public-read policy for published profiles, admin-only management policies, and audit triggers. Profile images are uploaded to the `iilm-bnv/star-ideators` Cloudinary folder. The public homepage displays only published profiles and revalidates cached content every 10 minutes.


## Star Ideators and Event Gallery pages

- Star Ideators are now displayed at `/star-ideators`; profiles continue to be managed from **Admin Studio → Star Ideators**. The homepage links to this dedicated page instead of listing all profiles inline.
- Event photos are displayed at `/event-gallery`. To add, publish, unpublish or remove a photo, sign in to **Admin Studio → Event Gallery**. Uploads go directly to the `iilm-bnv/event-gallery` Cloudinary folder.
- Before using the gallery, apply `supabase/migrations/20261016_event_gallery.sql` in the Supabase SQL Editor. It creates the `event_gallery` table, public read access for published photos, admin-only write policies and audit fields. Do not disable RLS.
- The Event Gallery upload requires the existing server-side Cloudinary environment variables and the updated Cloudinary signature endpoint. The public page shows only published records.
- The footer's **Follow us on Instagram** link opens the official Linktree (`https://linktr.ee/IILMxBNVInnovationLab`) because the exact Instagram profile URL is not hard-coded in this project; visitors can choose Instagram from the Linktree.
