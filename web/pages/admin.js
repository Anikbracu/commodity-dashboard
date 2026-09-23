import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [authorized, setAuthorized] = useState(null); // null = checking, false = denied, true = ok
  const [commodityId, setCommodityId] = useState("soybean_oil");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();
      setAuthorized(profile?.role === "admin");
    }
    checkAccess();
  }, [router]);

  async function handleAddPrice(e) {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("prices")
      .upsert({ commodity_id: commodityId, price_date: today, price: parseFloat(price) });
    setStatus(error ? `Error: ${error.message}` : "Saved.");
  }

  if (authorized === null) return <p style={{ padding: 20 }}>Checking access…</p>;
  if (authorized === false) return <p style={{ padding: 20 }}>Not authorized. Admin access only.</p>;

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Admin</h1>
      <p style={{ color: "#666" }}>
        WTI Crude, Wheat, Cotton, and Gold update automatically. Use this form only for Soybean Oil and Copra,
        which don't have a free live API yet.
      </p>
      <form onSubmit={handleAddPrice} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <label>
          Commodity
          <select value={commodityId} onChange={(e) => setCommodityId(e.target.value)} style={{ display: "block", width: "100%" }}>
            <option value="soybean_oil">Soybean Oil</option>
            <option value="copra">Copra</option>
          </select>
        </label>
        <label>
          Today's price
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <button type="submit">Save</button>
      </form>
      {status && <p>{status}</p>}
    </main>
  );
}
