import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { CartProvider } from "./context/CartContext.tsx";
import { ConfigProvider } from "./context/ConfigContext.tsx";
import { useLocale } from "./hooks/useLocale.ts";
import Header from "./components/Header.tsx";
import Footer from "./components/Footer.tsx";
import CartDrawer from "./components/CartDrawer.tsx";
import Home from "./pages/Home.tsx";
import Shop from "./pages/Shop.tsx";
import Product from "./pages/Product.tsx";
import About from "./pages/About.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import OrderConfirmation from "./pages/OrderConfirmation.tsx";
import FAQ from "./pages/FAQ.tsx";
import ShippingReturns from "./pages/ShippingReturns.tsx";

const AdminApp = lazy(() => import("./admin/AdminApp.tsx"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function HtmlLang() {
  const { lang } = useLocale();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}

export default function App() {
  return (
    <ConfigProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <HtmlLang />
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<p className="p-10 text-center text-sm text-charcoal/50">Chargement…</p>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/shop/:collection" element={<Shop />} />
                      <Route path="/product/:slug" element={<Product />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/shipping-returns" element={<ShippingReturns />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
                    </Routes>
                  </main>
                  <Footer />
                  <CartDrawer />
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </ConfigProvider>
  );
}
