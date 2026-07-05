import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { adminApi, cad } from "../api.ts";
import type { AdminProduct } from "../api.ts";

const COLLECTIONS = [
  { slug: "matching-sets", label: "Ensembles assortis" },
  { slug: "bags", label: "Sacs" },
  { slug: "sandals", label: "Sandales" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">{label}</span>
      {children}
    </label>
  );
}

function ProductEditor({
  product,
  onSaved,
}: {
  product: AdminProduct;
  onSaved: (p: AdminProduct) => void;
}) {
  const [form, setForm] = useState({ ...product });
  const [sizes, setSizes] = useState(product.sizes.map((s) => ({ ...s })));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasSizes = product.sizes.length > 0;

  const set = (field: keyof AdminProduct) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      let stock = Number(form.stock) || 0;
      if (hasSizes) {
        await adminApi.updateSizes(product.id, sizes.map((s) => ({ size: s.size, stock: Number(s.stock) || 0 })));
        stock = sizes.reduce((n, s) => n + (Number(s.stock) || 0), 0);
      }
      const updated = await adminApi.updateProduct(product.id, {
        name: form.name,
        priceCents: Number(form.priceCents) || 0,
        stock,
        featured: form.featured,
        archived: form.archived,
        descriptionEn: form.descriptionEn,
        descriptionFr: form.descriptionFr,
        colorEn: form.colorEn,
        colorFr: form.colorFr,
      });
      onSaved(updated);
      setMsg("Enregistré ✓");
      setTimeout(() => setMsg(null), 2500);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File) => {
    setBusy(true);
    try {
      await adminApi.uploadImage(product.id, file);
      const fresh = await adminApi.products();
      const updated = fresh.find((p) => p.id === product.id);
      if (updated) onSaved(updated);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur d'envoi");
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async (imageId: number) => {
    await adminApi.deleteImage(imageId).catch(() => {});
    onSaved({ ...product, images: product.images.filter((i) => i.id !== imageId) });
  };

  const moveImage = async (index: number, dir: -1 | 1) => {
    const ids = product.images.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    await adminApi.reorderImages(product.id, ids).catch(() => {});
    const byId = new Map(product.images.map((i) => [i.id, i]));
    onSaved({ ...product, images: ids.map((id) => byId.get(id)!) });
  };

  return (
    <div className="border-t border-charcoal/10 bg-ivory/60 px-5 py-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Nom (identique FR/EN)">
          <input className="field" value={form.name} onChange={set("name")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prix (cents CAD)">
            <input
              type="number" min={0} className="field" value={form.priceCents}
              onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))}
            />
          </Field>
          {!hasSizes && (
            <Field label="Stock">
              <input
                type="number" min={0} className="field" value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))}
              />
            </Field>
          )}
        </div>
        <Field label="Couleur (FR)">
          <input className="field" value={form.colorFr} onChange={set("colorFr")} />
        </Field>
        <Field label="Couleur (EN)">
          <input className="field" value={form.colorEn} onChange={set("colorEn")} />
        </Field>
        <Field label="Description (FR)">
          <textarea rows={3} className="field" value={form.descriptionFr} onChange={set("descriptionFr")} />
        </Field>
        <Field label="Description (EN)">
          <textarea rows={3} className="field" value={form.descriptionEn} onChange={set("descriptionEn")} />
        </Field>
      </div>

      {hasSizes && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
            Stock par pointure (le stock total est calculé automatiquement)
          </p>
          <div className="flex flex-wrap gap-3">
            {sizes.map((s, i) => (
              <label key={s.size} className="text-center">
                <span className="block text-[11px] text-charcoal/60">{s.size}</span>
                <input
                  type="number" min={0}
                  className="mt-1 w-16 border border-charcoal/20 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-gold"
                  value={s.stock}
                  onChange={(e) =>
                    setSizes((prev) => prev.map((x, j) => (j === i ? { ...x, stock: Number(e.target.value) } : x)))
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">Photos</p>
        <div className="flex flex-wrap items-start gap-3">
          {product.images.map((img, i) => (
            <div key={img.id} className="w-20">
              <div className="h-24 w-20 overflow-hidden bg-sand/30">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="mt-1 flex justify-between text-[12px] text-charcoal/60">
                <button onClick={() => moveImage(i, -1)} title="Vers la gauche" className="hover:text-forest">←</button>
                <button onClick={() => removeImage(img.id)} title="Supprimer" className="hover:text-terracotta">✕</button>
                <button onClick={() => moveImage(i, 1)} title="Vers la droite" className="hover:text-forest">→</button>
              </div>
            </div>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-20 items-center justify-center border border-dashed border-charcoal/30 text-2xl text-charcoal/40 hover:border-gold hover:text-gold"
            title="Ajouter une photo"
          >
            +
          </button>
          <input
            ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured}
                 onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="accent-[#183a2d]" />
          En vedette (page d'accueil)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.archived}
                 onChange={(e) => setForm((f) => ({ ...f, archived: e.target.checked }))} className="accent-[#183a2d]" />
          Archivé (retiré de la boutique)
        </label>
        <button onClick={save} disabled={busy} className="btn-primary ml-auto disabled:opacity-50">
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-forest">{msg}</p>}
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: "", collectionSlug: "bags", price: "" });

  useEffect(() => {
    adminApi.products().then(setProducts).catch((e: Error) => setError(e.message));
  }, []);

  const onSaved = (updated: AdminProduct) =>
    setProducts((prev) => prev?.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)) ?? null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminApi.createProduct({
        name: newProduct.name,
        collectionSlug: newProduct.collectionSlug,
        priceCents: Math.round(parseFloat(newProduct.price || "0") * 100),
      });
      setProducts((prev) => (prev ? [created, ...prev] : [created]));
      setNewProduct({ name: "", collectionSlug: "bags", price: "" });
      setOpenId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Produits</h1>

      <form onSubmit={create} className="mt-5 flex flex-wrap items-end gap-3 border border-charcoal/10 bg-white p-4">
        <Field label="Nouveau produit — nom">
          <input required className="field w-56" value={newProduct.name}
                 onChange={(e) => setNewProduct((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Collection">
          <select className="field" value={newProduct.collectionSlug}
                  onChange={(e) => setNewProduct((f) => ({ ...f, collectionSlug: e.target.value }))}>
            {COLLECTIONS.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Prix ($ CAD)">
          <input required type="number" step="0.01" min="0" className="field w-28" value={newProduct.price}
                 onChange={(e) => setNewProduct((f) => ({ ...f, price: e.target.value }))} />
        </Field>
        <button type="submit" className="btn-gold">Créer</button>
      </form>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

      {products === null ? (
        <p className="mt-10 text-sm text-charcoal/50">Chargement…</p>
      ) : (
        <div className="mt-6 space-y-2">
          {products.map((p) => {
            const open = openId === p.id;
            return (
              <div key={p.id} className={`border bg-white ${p.archived ? "border-charcoal/10 opacity-60" : "border-charcoal/10"}`}>
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left"
                >
                  <div className="h-14 w-11 shrink-0 overflow-hidden bg-sand/30">
                    {p.images[0] && <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-forest">{p.name}</p>
                    <p className="text-[12px] text-charcoal/50">{p.collection.nameFr}</p>
                  </div>
                  <span className="ml-auto flex items-center gap-4 text-sm">
                    <span>{cad(p.priceCents)}</span>
                    <span className={`px-2 py-0.5 text-[11px] font-semibold ${p.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                      Stock : {p.stock}
                    </span>
                    {p.archived && <span className="text-[11px] uppercase text-charcoal/50">Archivé</span>}
                    <span className="text-charcoal/40">{open ? "▴" : "▾"}</span>
                  </span>
                </button>
                {open && <ProductEditor product={p} onSaved={onSaved} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
