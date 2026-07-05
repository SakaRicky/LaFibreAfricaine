import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface StoreConfig {
  whatsappNumber: string;
  pickupNoteFr: string;
  pickupNoteEn: string;
}

const DEFAULTS: StoreConfig = {
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? "",
  pickupNoteFr: "",
  pickupNoteEn: "",
};

const ConfigContext = createContext<StoreConfig>(DEFAULTS);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<StoreConfig>(DEFAULTS);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c: StoreConfig) => setConfig({ ...DEFAULTS, ...c }))
      .catch(() => {});
  }, []);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig(): StoreConfig {
  return useContext(ConfigContext);
}
