"use client";

import { useAppData } from "@/lib/app-data";
import { EstadosConfig } from "@/components/config/estados-config";
import { TiposTrabajoConfig } from "@/components/config/tipos-trabajo-config";
import { ColorPrincipalConfig } from "@/components/config/color-principal-config";
import { AvisoTimerConfig } from "@/components/config/aviso-timer-config";
import { GrillaRegistroConfig } from "@/components/config/grilla-registro-config";

export default function ConfiguracionPage() {
  const { estados, setEstados, tipos, setTipos, tema, setTema, loading, error } = useAppData();

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar la configuración: {error}
      </p>
    );
  }

  if (loading || !tema) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Configuración
      </h1>
      <ColorPrincipalConfig
        colorPrincipal={tema.colorPrincipal}
        onChange={(colorPrincipal) => setTema({ ...tema, colorPrincipal })}
      />
      <EstadosConfig
        estados={estados}
        colorPrincipal={tema.colorPrincipal}
        onChange={setEstados}
      />
      <TiposTrabajoConfig tipos={tipos} onChange={setTipos} />
      <AvisoTimerConfig
        avisoTimerHoras={tema.avisoTimerHoras}
        onChange={(avisoTimerHoras) => setTema({ ...tema, avisoTimerHoras })}
      />
      <GrillaRegistroConfig
        inicioSemana={tema.inicioSemana}
        horaInicioGrilla={tema.horaInicioGrilla}
        onChange={(cambios) => setTema({ ...tema, ...cambios })}
      />
    </div>
  );
}
