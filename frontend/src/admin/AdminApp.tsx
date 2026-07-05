import { createContext, useContext, useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { adminApi } from "./api.ts";
import type { AdminMe } from "./api.ts";
import Emblem from "../components/Emblem.tsx";
import Login from "./pages/Login.tsx";
import Orders from "./pages/Orders.tsx";
import Products from "./pages/Products.tsx";
import Settings from "./pages/Settings.tsx";
import Admins from "./pages/Admins.tsx";
import Account from "./pages/Account.tsx";

interface AuthCtx {
  me: AdminMe | null;
  setMe: (me: AdminMe | null) => void;
}

const AdminAuthContext = createContext<AuthCtx>({ me: null, setMe: () => {} });
export const useAdminAuth = () => useContext(AdminAuthContext);

const NAV = [
  { to: "/admin/orders", label: "Commandes" },
  { to: "/admin/products", label: "Produits" },
  { to: "/admin/settings", label: "Réglages" },
  { to: "/admin/admins", label: "Administrateurs" },
  { to: "/admin/account", label: "Mon compte" },
];

function Layout({ children }: { children: React.ReactNode }) {
  const { me, setMe } = useAdminAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await adminApi.logout().catch(() => {});
    setMe(null);
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className="flex w-60 shrink-0 flex-col bg-forest text-ivory">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <Emblem className="h-8 w-8 text-gold" />
          <div className="leading-tight">
            <p className="font-display text-base font-semibold tracking-[0.06em]">LA FIBRE AFRICAINE</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-ivory/60">Administration</p>
          </div>
        </div>
        <nav className="flex-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `mb-1 block px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors ${
                  isActive ? "bg-ivory/10 text-gold" : "text-ivory/80 hover:bg-ivory/5 hover:text-ivory"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ivory/10 p-3 text-[13px]">
          <Link to="/" className="block px-3 py-2 text-ivory/70 hover:text-gold">← Voir la boutique</Link>
          <button onClick={logout} className="block w-full px-3 py-2 text-left text-ivory/70 hover:text-terracotta">
            Déconnexion {me ? `(${me.name || me.email})` : ""}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { me } = useAdminAuth();
  if (me === null) return <Navigate to="/admin/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function AdminApp() {
  const [me, setMe] = useState<AdminMe | null | undefined>(undefined);

  useEffect(() => {
    adminApi.me().then(setMe).catch(() => setMe(null));
  }, []);

  if (me === undefined) {
    return <p className="p-10 text-center text-sm text-charcoal/50">Chargement…</p>;
  }

  return (
    <AdminAuthContext.Provider value={{ me, setMe: setMe as AuthCtx["setMe"] }}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route path="orders" element={<Guard><Orders /></Guard>} />
        <Route path="products" element={<Guard><Products /></Guard>} />
        <Route path="settings" element={<Guard><Settings /></Guard>} />
        <Route path="admins" element={<Guard><Admins /></Guard>} />
        <Route path="account" element={<Guard><Account /></Guard>} />
        <Route path="*" element={<Navigate to="/admin/orders" replace />} />
      </Routes>
    </AdminAuthContext.Provider>
  );
}
