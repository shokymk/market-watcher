import YahooFinance from "yahoo-finance2";

export const revalidate = 300; // 5 minutes

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type IndexDef = {
  label: string;
  symbol: string;
};

const INDEXES: IndexDef[] = [
  { label: "S&P 500", symbol: "^GSPC" },
  { label: "Nasdaq 100", symbol: "^NDX" },
  { label: "Dow Jones", symbol: "^DJI" },
  { label: "Russell 2000", symbol: "^RUT" },
  { label: "VIX", symbol: "^VIX" },
];

function fmtNumber(value?: number, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function fmtInt(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function fmtPercent(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function fmtX(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}x`;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function getMarketData() {
  const indexQuotes = await Promise.all(
    INDEXES.map(async (idx) => {
      const q = await yf.quote(idx.symbol);
      return {
        ...idx,
        price: q.regularMarketPrice,
        changePct: q.regularMarketChangePercent,
      };
    })
  );

  const mostActives = await yf.screener({
    scrIds: "most_actives",
    count: 50,
  });

  const quotes = (mostActives.quotes ?? []).filter(
    (q) =>
      q.symbol &&
      q.regularMarketVolume != null &&
      q.averageDailyVolume3Month != null &&
      q.regularMarketPrice != null
  );

  const topVolume = [...quotes]
    .sort((a, b) => (b.regularMarketVolume ?? 0) - (a.regularMarketVolume ?? 0))
    .slice(0, 15);

  const topRelativeVolume = [...quotes]
    .map((q) => ({
      ...q,
      relativeVolume:
        (q.regularMarketVolume ?? 0) / Math.max(1, q.averageDailyVolume3Month ?? 1),
    }))
    .sort((a, b) => (b.relativeVolume ?? 0) - (a.relativeVolume ?? 0))
    .slice(0, 15);

  const upCount = indexQuotes.filter((x) => (x.changePct ?? 0) > 0).length;
  const downCount = indexQuotes.filter((x) => (x.changePct ?? 0) < 0).length;

  const avgAbsMove =
    indexQuotes.reduce((acc, x) => acc + Math.abs(x.changePct ?? 0), 0) /
    indexQuotes.length;

  const marketHealth =
    upCount >= 4
      ? "Risk-on"
      : downCount >= 4
        ? "Risk-off"
        : avgAbsMove > 1.5
          ? "High volatility"
          : "Mixed";

  return {
    asOf: new Date().toISOString(),
    indexQuotes,
    topVolume,
    topRelativeVolume,
    marketHealth,
  };
}

export default async function Home() {
  const data = await getMarketData();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Market Watcher</h1>
            <p className="mt-2 text-zinc-400">
              US market dashboard • updates every 5 minutes
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
            <div className="text-zinc-400">Market health</div>
            <div className="text-lg font-semibold">{data.marketHealth}</div>
            <div className="text-xs text-zinc-500">
              As of {new Date(data.asOf).toLocaleString("en-US")}
            </div>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">Major indexes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.indexQuotes.map((idx) => (
              <article
                key={idx.symbol}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="text-sm text-zinc-400">{idx.label}</div>
                <div className="mt-1 text-xl font-semibold">{fmtNumber(idx.price)}</div>
                <div
                  className={cn(
                    "mt-1 text-sm font-medium",
                    (idx.changePct ?? 0) > 0 && "text-emerald-400",
                    (idx.changePct ?? 0) < 0 && "text-rose-400",
                    (idx.changePct ?? 0) === 0 && "text-zinc-400"
                  )}
                >
                  {fmtPercent(idx.changePct)}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-semibold">Biggest volume (US most active)</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/70 text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Ticker</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Volume</th>
                    <th className="px-3 py-2 text-right">Avg Vol (3M)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topVolume.map((q) => (
                    <tr key={q.symbol} className="border-t border-zinc-800">
                      <td className="px-3 py-2 font-medium">{q.symbol}</td>
                      <td className="px-3 py-2 text-right">{fmtNumber(q.regularMarketPrice)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(q.regularMarketVolume)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(q.averageDailyVolume3Month)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">Largest relative volume movers</h2>
            <p className="mb-2 text-xs text-zinc-500">
              Relative volume = current volume / 3-month average volume
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
              <table className="w-full text-sm">
                <thead className="bg-zinc-800/70 text-zinc-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Ticker</th>
                    <th className="px-3 py-2 text-right">Rel Vol</th>
                    <th className="px-3 py-2 text-right">Volume</th>
                    <th className="px-3 py-2 text-right">Avg Vol (3M)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRelativeVolume.map((q) => (
                    <tr key={q.symbol} className="border-t border-zinc-800">
                      <td className="px-3 py-2 font-medium">{q.symbol}</td>
                      <td className="px-3 py-2 text-right font-semibold text-amber-300">
                        {fmtX((q as { relativeVolume?: number }).relativeVolume)}
                      </td>
                      <td className="px-3 py-2 text-right">{fmtInt(q.regularMarketVolume)}</td>
                      <td className="px-3 py-2 text-right">{fmtInt(q.averageDailyVolume3Month)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
