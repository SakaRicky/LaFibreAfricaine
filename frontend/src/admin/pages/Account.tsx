import { useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api.ts";
import { useAdminAuth } from "../AdminApp.tsx";

export default function Account() {
  const { me, setMe } = useAdminAuth();
  const [form, setForm] = useState({
    name: me?.name ?? "",
    email: me?.email ?? "",
    currentPassword: "",
    newPassword: "",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const updated = await adminApi.updateMe({
        currentPassword: form.currentPassword,
        email: form.email,
        name: form.name,
        newPassword: form.newPassword || undefined,
      });
      setMe(updated);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      setMsg("Compte mis à jour ✓");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Mon compte</h1>
      <form onSubmit={save} className="mt-6 space-y-4 border border-charcoal/10 bg-white p-6">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Nom</span>
          <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Courriel</span>
          <input required type="email" className="field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Nouveau mot de passe (optionnel, min. 8 caractères)</span>
          <input type="password" className="field" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} autoComplete="new-password" />
        </label>
        <hr className="border-charcoal/10" />
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-terracotta">Mot de passe actuel (requis pour toute modification)</span>
          <input required type="password" className="field" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} autoComplete="current-password" />
        </label>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "Enregistrement…" : "Mettre à jour"}
        </button>
        {msg && <p className="text-sm text-forest">{msg}</p>}
      </form>
    </div>
  );
}
