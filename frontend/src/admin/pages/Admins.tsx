import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api.ts";
import type { AdminMe } from "../api.ts";

export default function Admins() {
  const [admins, setAdmins] = useState<(AdminMe & { createdAt: string })[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", tempPassword: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    adminApi.admins().then(setAdmins).catch((e: Error) => setMsg(e.message));
  }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await adminApi.addAdmin(form);
      setAdmins(await adminApi.admins());
      setMsg(`Admin ajouté. Partagez le mot de passe temporaire de façon sécurisée — il devra le changer dans « Mon compte ».`);
      setForm({ name: "", email: "", tempPassword: "" });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Administrateurs</h1>

      {admins === null ? (
        <p className="mt-6 text-sm text-charcoal/50">Chargement…</p>
      ) : (
        <ul className="mt-6 divide-y divide-charcoal/10 border border-charcoal/10 bg-white">
          {admins.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span>
                <span className="font-medium text-forest">{a.name || "—"}</span>
                <span className="ml-2 text-charcoal/60">{a.email}</span>
              </span>
              <span className="text-[12px] text-charcoal/45">
                depuis le {new Date(a.createdAt).toLocaleDateString("fr-CA")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-8 space-y-4 border border-charcoal/10 bg-white p-6">
        <h2 className="font-display text-xl font-semibold">Ajouter un administrateur</h2>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Nom</span>
          <input required className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Courriel</span>
          <input required type="email" className="field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">Mot de passe temporaire (min. 8 caractères)</span>
          <input required minLength={8} className="field" value={form.tempPassword} onChange={(e) => setForm((f) => ({ ...f, tempPassword: e.target.value }))} />
        </label>
        <button type="submit" className="btn-primary">Ajouter</button>
        {msg && <p className="text-sm text-forest">{msg}</p>}
      </form>
    </div>
  );
}
