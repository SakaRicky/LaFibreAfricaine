import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api.ts";
import { useAdminAuth } from "../AdminApp.tsx";
import Emblem from "../../components/Emblem.tsx";

export default function Login() {
  const { setMe } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await adminApi.login(email, password);
      setMe(me);
      navigate("/admin/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-forest px-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-ivory p-8 shadow-2xl">
        <div className="flex flex-col items-center">
          <Emblem className="h-10 w-10 text-gold" />
          <h1 className="mt-3 font-display text-2xl font-semibold text-forest">Administration</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] text-charcoal/50">La Fibre Africaine</p>
        </div>
        <label className="mt-7 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">Courriel</span>
          <input type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">Mot de passe</span>
          <input type="password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-6 w-full disabled:opacity-50">
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
