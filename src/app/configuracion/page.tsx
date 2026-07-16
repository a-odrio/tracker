"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import type { ColorPaletaItem, EstadoItem, TipoTrabajoItem } from "@/lib/types";
import { EstadosConfig } from "@/components/config/estados-config";
import { TiposTrabajoConfig } from "@/components/config/tipos-trabajo-config";
import { PaletaConfig } from "@/components/config/paleta-config";

export default function ConfiguracionPage() {
  const [estados, setEstados] = useState<EstadoItem[]>([]);
  const [tipos, setTipos] = useState<TipoTrabajoItem[]>([]);
  const [paleta, setPaleta] = useState<ColorPaletaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiGet<EstadoItem[]>("/api/estados"),
      apiGet<TipoTrabajoItem[]>("/api/tipos-trabajo?incluirInactivos=true"),
      apiGet<ColorPaletaItem[]>("/api/paleta"),
    ])
      .then(([e, t, p]) => {
        setEstados(e);
        setTipos(t);
        setPaleta(p);
        setLoading(false);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        Error al cargar la configuración: {error}
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Cargando…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Configuración
      </h1>
      <PaletaConfig paleta={paleta} onChange={setPaleta} />
      <EstadosConfig estados={estados} paleta={paleta} onChange={setEstados} />
      <TiposTrabajoConfig tipos={tipos} onChange={setTipos} />
    </div>
  );
}
