import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";
import Emblem from "./Emblem.tsx";

export default function Header() {
  const { count } = useCart();
  const { t, lang, toggle } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll and allow Escape while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const nav = [
    { to: "/shop", label: t("nav.shopAll") },
    { to: "/shop/matching-sets", label: t("nav.matchingSets") },
    { to: "/shop/bags", label: t("nav.bags") },
    { to: "/shop/sandals", label: t("nav.sandals") },
    { to: "/about", label: t("nav.ourStory") },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-forest py-2 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-sand">
        {t("announcement")}
      </div>

      <div
        className={`border-b border-charcoal/10 bg-ivory/95 backdrop-blur transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_24px_rgba(24,58,45,0.08)]" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Emblem className="h-9 w-9 text-gold" />
            <span className="leading-tight">
              <span className="block font-display text-[22px] font-semibold tracking-[0.08em] text-forest">
                LA FIBRE
              </span>
              <span className="block font-display text-[13px] font-medium tracking-[0.42em] text-forest/80">
                AFRICAINE
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/shop"}
                className={({ isActive }) =>
                  `link-underline text-[13px] font-medium uppercase tracking-[0.16em] transition-colors ${
                    isActive ? "text-gold" : "text-charcoal hover:text-gold"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="border border-charcoal/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
              aria-label={lang === "en" ? "Passer au français" : "Switch to English"}
            >
              {lang === "en" ? "FR" : "EN"}
            </button>

            <Link to="/cart" className="relative p-1 text-forest hover:text-gold" aria-label={t("nav.cart")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                <path d="M6 7h12l1.2 13H4.8L6 7Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-white">
                  {count}
                </span>
              )}
            </Link>

            <button
              className="p-1 text-forest lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                className={`h-6 w-6 transition-transform duration-300 ease-out ${open ? "rotate-90" : ""}`}
              >
                {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu — overlay panel, never pushes the page */}
      <div className={`fixed inset-0 z-[-1] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          className={`absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-ivory px-8 pt-36 pb-10 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {nav.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/shop"}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${140 + i * 60}ms` : "0ms" }}
              className={({ isActive }) =>
                `block py-3 font-display text-3xl font-semibold transition-all duration-500 ease-out ${
                  open ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
                } ${isActive ? "text-gold" : "text-forest hover:text-gold"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div
            style={{ transitionDelay: open ? `${140 + nav.length * 60 + 80}ms` : "0ms" }}
            className={`mt-auto border-t border-charcoal/10 pt-6 transition-all duration-500 ${
              open ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
            }`}
          >
            <p className="font-display text-lg font-medium italic text-gold">
              {t("hero.eyebrow")} — {t("hero.title")}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-charcoal/50">
              La Fibre Africaine · Montréal
            </p>
          </div>
        </nav>
      </div>
    </header>
  );
}
