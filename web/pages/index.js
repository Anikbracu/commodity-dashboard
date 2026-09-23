import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

// Finds the price closest to `daysAgo` days before the latest date, to compute % change.
function pctChange(history, daysAgo) {
  if (history.length < 2) return null;
  const latest = history[0];
  const targetTime = new Date(latest.price_date).getTime() - daysAgo * 86400000;
  let closest = history[history.length - 1];
  for (const row of history) {
    if (new Date(row.price_date).getTime() <= targetTime) {
      closest = row;
      break;
    }
  }
  if (!closest || closest.price === 0) return null;
  return ((latest.price - closest.price) / closest.price) * 100;
}

function fmtPct(v) {
  if (v === null || Number.isNaN(v)) return "—";
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

export default function GuestDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: commodities } = await supabase.from("commodities").select("*");
      const results = [];
      for (const c of commodities ?? []) {
        const { data: history } = await supabase
          .from("prices")
          .select("price_date, price")
          .eq("commodity_id", c.id)
          .order("price_date", { ascending: false })
          .limit(400);
        if (!history || history.length === 0) continue;
        results.push({
          ...c,
          latest: history[0],
          week: pctChange(history, 7),
          month: pctChange(history, 30),
          year: pctChange(history, 365),
        });
      }
      setRows(results);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Weekly Commodity Monitor</h1>
        <Link href="/login">Sign in</Link>
      </div>
      <p style={{ color: "#666" }}>Live data. No login required to view.</p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #333" }}>
              <th style={{ padding: 8 }}>Commodity</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Price</th>
              <th style={{ padding: 8 }}>1-Week</th>
              <th style={{ padding: 8 }}>1-Month</th>
              <th style={{ padding: 8 }}>1-Year</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{r.display_name}</td>
                <td style={{ padding: 8 }}>{r.latest.price_date}</td>
                <td style={{ padding: 8 }}>
                  {r.unit} {r.latest.price}
                </td>
                <td style={{ padding: 8, color: r.week >= 0 ? "green" : "crimson" }}>{fmtPct(r.week)}</td>
                <td style={{ padding: 8, color: r.month >= 0 ? "green" : "crimson" }}>{fmtPct(r.month)}</td>
                <td style={{ padding: 8, color: r.year >= 0 ? "green" : "crimson" }}>{fmtPct(r.year)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
