import { Link } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.tsx";
import { useLocale } from "../hooks/useLocale.ts";
import Emblem from "./Emblem.tsx";

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return `+${d}`;
}

export default function Footer() {
  const { t } = useLocale();
  const { whatsappNumber } = useConfig();
  const phone = whatsappNumber ? formatPhone(whatsappNumber) : null;

  return (
    <footer className="bg-forest text-ivory/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Emblem className="h-8 w-8 text-gold" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold tracking-[0.08em] text-ivory">
                LA FIBRE
              </span>
              <span className="block font-display text-[11px] tracking-[0.42em] text-ivory/70">
                AFRICAINE
              </span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("brand.tagline")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.25em] text-gold">
            {t("footer.shop")}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/shop" className="transition-colors hover:text-gold">{t("footer.allProducts")}</Link></li>
            <li><Link to="/shop/matching-sets" className="transition-colors hover:text-gold">{t("nav.matchingSets")}</Link></li>
            <li><Link to="/shop/bags" className="transition-colors hover:text-gold">{t("nav.bags")}</Link></li>
            <li><Link to="/shop/sandals" className="transition-colors hover:text-gold">{t("nav.sandals")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.25em] text-gold">
            {t("footer.care")}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/faq" className="transition-colors hover:text-gold">{t("footer.faq")}</Link></li>
            <li><Link to="/shipping-returns" className="transition-colors hover:text-gold">{t("footer.shippingReturns")}</Link></li>
            {phone && (
              <li>
                <a href={`tel:+${whatsappNumber}`} className="transition-colors hover:text-gold">{phone}</a>
              </li>
            )}
            <li>
              <a href="mailto:contact@lafibreafricaine.com" className="transition-colors hover:text-gold">
                contact@lafibreafricaine.com
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-[12px] font-medium uppercase tracking-[0.25em] text-gold">
            {t("footer.company")}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="transition-colors hover:text-gold">{t("nav.ourStory")}</Link></li>
            <li>{t("footer.crafted")}</li>
            <li>{t("footer.based")}</li>
            <li>@lafibreafricaine</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10 py-5 text-center text-[12px] tracking-[0.14em] text-ivory/50">
        © {new Date().getFullYear()} La Fibre Africaine. {t("footer.rights")} — {t("hero.eyebrow")} {t("hero.title")}
        <span className="mx-2">·</span>
        <Link to="/admin" className="transition-colors hover:text-gold">{t("footer.admin")}</Link>
      </div>
    </footer>
  );
}
