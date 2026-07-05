import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminApi } from "../api.ts";
import type { AdminSettings } from "../api.ts";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "alert_email", label: "Courriel des alertes commandes", hint: "Reçoit un courriel à chaque nouvelle commande." },
  { key: "whatsapp_number", label: "Numéro WhatsApp de la boutique", hint: "Chiffres seulement, format international (ex. 12638807371)." },
  { key: "pickup_note_fr", label: "Note de ramassage (FR)", hint: "Affichée à la caisse pour l'option ramassage." },
  { key: "pickup_note_en", label: "Note de ramassage (EN)" },
  { key: "thankyou_code", label: "Code promo de remerciement", hint: "Inclus dans le courriel envoyé quand une commande passe à « Payée »." },
];

export default function Settings() {
  const [values, setValues] = useState<AdminSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.settings().then(setValues).catch((e: Error) => setMsg(e.message));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setBusy(true);
    setMsg(null);
    try {
      const saved = await adminApi.saveSettings(values);
      setValues(saved);
      setMsg("Réglages enregistrés ✓");
      setTimeout(() => setMsg(null), 2500);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  if (!values) return <p className="text-sm text-charcoal/50">Chargement…</p>;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold">Réglages</h1>
      <form onSubmit={save} className="mt-6 space-y-5 border border-charcoal/10 bg-white p-6">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest">{f.label}</span>
            <input
              className="field"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v!, [f.key]: e.target.value }))}
            />
            {f.hint && <span className="mt-1 block text-[12px] text-charcoal/50">{f.hint}</span>}
          </label>
        ))}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {msg && <p className="text-sm text-forest">{msg}</p>}
      </form>
    </div>
  );
}
