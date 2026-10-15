# 02 — Connected to Supabase

**What to build:** The app is connected to the team's hosted Supabase
project, and the `profiles` table from the spec exists with Row Level
Security on, so the live site can safely talk to the database.

**Blocked by:** 01

**Status:** todo

- [ ] The Supabase URL and publishable (anon) key are set on the driver
      laptop and in Vercel, and Vercel has redeployed
- [ ] No service_role or secret key appears anywhere in the project, and
      the local environment file is not committed
- [ ] The `profiles` table exists with the columns in the spec
- [ ] Row Level Security is on for `profiles`, with the policies from the
      spec: any logged-in trader may read; only you may create or update
      your own row; nobody may delete
- [ ] The database change is saved as a numbered file in the repo's SQL
      folder, so the database can be rebuilt from the repo
- [ ] Works on the live URL: the site queries `profiles` without an error
