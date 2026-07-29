"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAppData } from "@/lib/app-data";
import { Sidebar } from "@/components/sidebar";
import { GlobalTimerWidget } from "@/components/timetracking/global-timer-widget";
import { PadreParaCerrarBanner } from "@/components/padre-para-cerrar-banner";
import { InstanciaRecurrenteBanner } from "@/components/instancia-recurrente-banner";
import { LoadingSplash } from "@/components/loading-splash";

/** El splash se queda montado al menos este tiempo aunque los datos ya
 * hayan llegado, para que nunca se vea como un parpadeo — mejor demorar un
 * poco de más que arriesgarse a mostrar un estado vacío de arranque. */
const DURACION_MINIMA_MS = 900;

/** Gatea todo el shell de la app (sidebar, banners, timer flotante) detrás
 * del fetch inicial de AppDataProvider, para mostrar un splash con avance
 * real en vez de un layout vacío/a medio armar mientras carga. */
export function AppShell({ children }: { children: ReactNode }) {
  const { loading, loadingProgress } = useAppData();
  const [duracionMinimaCumplida, setDuracionMinimaCumplida] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDuracionMinimaCumplida(true), DURACION_MINIMA_MS);
    return () => clearTimeout(id);
  }, []);

  if (loading || !duracionMinimaCumplida) {
    return <LoadingSplash progress={loading ? loadingProgress : 1} />;
  }

  return (
    <>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-slate-50 p-6 dark:bg-slate-950">
          <PadreParaCerrarBanner />
          <InstanciaRecurrenteBanner />
          {children}
        </main>
      </div>
      <GlobalTimerWidget />
    </>
  );
}
