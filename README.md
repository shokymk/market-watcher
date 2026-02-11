# Market Watcher

Next.js 16 dashboard that tracks US market health with 5-minute refresh:

- Major indexes: **S&P 500, Nasdaq 100, Dow Jones, Russell 2000, VIX**
- Biggest current volume stocks (US most active universe)
- Biggest relative-volume movers (`current volume / 3-month avg volume`)

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Yahoo Finance data via `yahoo-finance2` (no API key needed for MVP)

## Run locally

```bash
npm install
npm run dev
```

Open: http://localhost:3000

## Notes

- Data is fetched server-side and revalidated every **5 minutes**.
- "Biggest volume" and "relative volume movers" are based on Yahoo's US most-active screener.
- This is an MVP dashboard (no alerts yet).
