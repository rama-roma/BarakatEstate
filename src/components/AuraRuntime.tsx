"use client";

import Image from "next/image";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

type AuraWindow = Window & {
  __auraScriptLoaded?: boolean;
  BARAKAT_API_URL?: string;
  hideLoader?: () => void;
  hydrateAuraPage?: (page: string) => void;
};

function pageFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment || "home";
}

export default function AuraRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    const auraWindow = window as AuraWindow;
    const page = pageFromPath(pathname);
    const isDev = process.env.NODE_ENV === "development";
    auraWindow.BARAKAT_API_URL = isDev ? "http://localhost:3001" : (process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3001");

    const boot = async () => {
      await auraWindow.hydrateAuraPage?.(page);
      auraWindow.hideLoader?.();
    };

    if (auraWindow.__auraScriptLoaded) {
      window.setTimeout(boot, 0);
      return;
    }

    const script = document.createElement("script");
    script.src = "/aura-source.js";
    script.async = false;
    script.onload = () => {
      auraWindow.__auraScriptLoaded = true;
      boot();
    };
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [pathname]);

  return (
    <>
      <div className="page-loader" id="loader">
        <div className="loader-logo">
          <Image src="/barakat.PNG" alt="Barakat Estate" width={200} height={200} priority />
        </div>
      </div>
      <div className="notif" id="notif">
        <div className="dot" />
        <span id="notif-text" />
      </div>
    </>
  );
}
