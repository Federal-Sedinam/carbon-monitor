# Carbon Monitor

A live view of how much CO₂ the Great Britain electricity grid is emitting right now. Built with Vite and TypeScript — **no framework**.

Data from the [National Grid Carbon Intensity API](https://carbonintensity.org.uk/).

> **Status: in progress.** The national reading works end to end. Regional data, history and filtering are next — see [Roadmap](#roadmap). I'm building this deliberately rather than quickly, so the commit history reads as a sequence of decisions rather than one dump.

---

## Why no framework?

To understand what a framework actually does for you.

Going without one means making — and writing down — every decision React would otherwise make silently: how a component is defined, when it updates, who owns state, how the DOM gets cleaned up. That's the point of the exercise.

## What it does today

- Fetches and displays the current national carbon intensity in gCO₂/kWh
- Distinguishes a **measured** reading from a **forecast** one, and says which you're looking at
- Explicit loading and failure states, with a retry that actually clears the previous error
- Colour-coded by intensity band, driven by a data attribute rather than a class name
- Mobile-first, readable from 320px up, no horizontal scroll

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run typecheck` | `tsc -b` across both project configs |
| `npm run build` | Type-check, then bundle to `dist/` |
| `npm run preview` | Serve the built output as a host would |

---

## Decisions worth explaining

### The API's shape is not the app's shape

The API returns `{ forecast, actual, index }`, where `actual` is `null` until a half-hour settlement period closes — so for up to 30 minutes at a time there is no measured figure at all.

Rather than leak that into the UI, `services/carbon-api.ts` translates it into one clean domain type:

```ts
export interface Reading {
  readonly value: number                    // never null
  readonly basis: 'measured' | 'forecast'   // says which number this is
  readonly band: Band                       // safe as a data attribute
  readonly from: Date
  readonly to: Date
}
```

The UI never checks for `null`, and it can honestly label a forecast as a forecast. When the API changes, one file changes.

### `fetch` doesn't throw on HTTP errors

A `500` is a *fulfilled* promise with `ok: false`. Only a genuine network failure rejects. Miss that and you'll parse an error page as data.

`lib/http.ts` is the only place in the app that calls `fetch`, so the check exists exactly once and can't be forgotten:

```ts
if (!response.ok) {
  const body = await response.json().catch(() => null)
  throw new HttpError(
    response.status,
    url,
    body?.error?.message ?? `Request failed with status ${response.status}`,
  )
}
```

`getJson` returns `Promise<unknown>` rather than `any`, deliberately — so callers can't quietly skip validating what came back. Runtime validation is the next piece of work.

### Two environments, two TypeScript configs

`src/` runs in a browser and has `document`. `vite.config.ts` runs in Node and has `process`. A single shared config would let browser code reference Node globals and crash for users.

So `tsconfig.app.json` carries DOM types and no Node; `tsconfig.node.json` carries Node types and no DOM. The boundary is enforced by the compiler rather than by memory.

### Illegal states are unrepresentable

Three booleans (`isLoading`, `error`, `data`) describe eight states, half of them nonsense — loading *and* errored, data *and* errored. A discriminated union describes exactly four:

```ts
type ViewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; reading: Reading }
  | { status: 'failed'; message: string }
```

Each state replaces the previous one whole, so a stale error can't survive a successful retry. A `never` guard in the render `switch` turns "added a state, forgot to handle it" into a compile error rather than a blank screen.

---

## Things I learned by hitting them

**The API omits CORS headers on error responses.** It sends `access-control-allow-origin: *` on success, but not on any 4xx I tested. A browser therefore blocks the error body and `fetch` rejects with `TypeError: Failed to fetch` — indistinguishable from being offline. So "Failed to fetch" doesn't always mean the network is down; it can mean a server refused to let you read a perfectly real reply.

**The intensity band contains a space.** `"very low"`, not `"very-low"`. Interpolated straight into a class name it silently becomes *two* classes and the styling vanishes — for two of the five bands only. Mapped explicitly to a safe identifier at the boundary, and applied via `data-band` rather than a class name, so it can't recur.

**`??` is not `||`.** `actual || forecast` treats a reading of `0` as missing — and `0` gCO₂/kWh is a real, achievable figure on a windy night in Scotland. The greenest possible grid would have silently displayed as a forecast.

---

## Roadmap

- [x] Live national reading with loading and failure states
- [x] Domain types translated at the API boundary
- [ ] Runtime validation of API responses
- [ ] A component contract with explicit teardown
- [ ] Routing and code-splitting
- [ ] All 17 grid regions with fuel mix
- [ ] Postcode search and filtering, with filter state in the URL
- [ ] Windowed pagination over history (the API caps ranges at 14 days)
- [ ] Response caching and request deduplication
- [ ] Settlement-aligned polling, paused on hidden tabs
- [ ] Keyboard navigation and ARIA
- [ ] Tests

## Built with

TypeScript · Vite · no runtime dependencies
