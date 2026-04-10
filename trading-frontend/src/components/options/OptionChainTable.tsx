import { OptionChainRow } from "@/types/option";

const formatNumber = (num: number) => Intl.NumberFormat("en-IN").format(num);

function Cell({ value, positive }: { value: string | number; positive?: boolean }) {
  return (
    <td className={`px-3 py-2 text-right text-xs ${positive === undefined ? "text-zinc-300" : positive ? "text-emerald-400" : "text-red-400"}`}>
      {value}
    </td>
  );
}

export function OptionChainTable({ rows }: { rows: OptionChainRow[] }) {
  return (
    <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-zinc-900/70">
      <table className="w-full min-w-[980px] border-separate border-spacing-0">
        <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur">
          <tr>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">CE OI</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">CE IV</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">CE Vol</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">CE LTP</th>
            <th className="border-b border-white/10 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">Strike</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">PE LTP</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">PE Vol</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">PE IV</th>
            <th className="border-b border-white/10 px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">PE OI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.strike} className="transition hover:bg-white/[0.03]">
              <Cell value={formatNumber(row.ce.oi)} />
              <Cell value={row.ce.iv.toFixed(2)} />
              <Cell value={formatNumber(row.ce.volume)} />
              <Cell value={row.ce.ltp.toFixed(2)} positive={row.ce.change >= 0} />
              <td className="border-x border-white/5 px-3 py-2 text-center text-xs font-semibold text-zinc-100">{row.strike}</td>
              <Cell value={row.pe.ltp.toFixed(2)} positive={row.pe.change >= 0} />
              <Cell value={formatNumber(row.pe.volume)} />
              <Cell value={row.pe.iv.toFixed(2)} />
              <Cell value={formatNumber(row.pe.oi)} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
