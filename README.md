# Unpack Hostel — admin

Existing staff operations frontend, formerly `hostel-frontend`.
Its Git history and GitHub remote are unchanged.

```sh
npm ci
npm run dev
```

Runs at http://localhost:3000. Set `NEXT_PUBLIC_API_URL=http://localhost:5001`
in `.env.local` to connect to the shared Express backend in `../backend`.

Use `npm test` and `npx tsc --noEmit` for checks.
The separate guest website lives in `../website` and runs on port 3001.
Staff authentication remains deferred; do not expose admin APIs publicly until it is implemented.
