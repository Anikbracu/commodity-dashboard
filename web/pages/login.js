import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    router.push(profile?.role === "admin" ? "/admin" : "/");
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit">Sign in</button>
      </form>
      <p style={{ marginTop: 20 }}>
        <a href="/">← Back to public dashboard</a>
      </p>
    </main>
  );
}
