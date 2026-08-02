"use client";

import { formatarDataCurta, formatarNumero, type SerieFrente } from "@/lib/dashboard";

interface TrendChartProps {
  series: SerieFrente[];
  cores: Record<string, string>;
  height?: number;
}

/** Gráfico de linha (SVG, sem dependência externa) — produção acumulada por frente ao longo do tempo. */
export function TrendChart({ series, cores, height = 220 }: TrendChartProps) {
  const comDados = series.filter((s) => s.pontos.length > 0);

  if (comDados.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">
        Ainda não há apontamentos suficientes para traçar a tendência.
      </p>
    );
  }

  const todasDatas = [...new Set(comDados.flatMap((s) => s.pontos.map((p) => p.data)))].sort();
  const maxValor = Math.max(1, ...comDados.flatMap((s) => s.pontos.map((p) => p.valor)));

  const width = 600;
  const padLeft = 34;
  const padRight = 8;
  const padTop = 10;
  const padBottom = 22;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const xFor = (data: string) => {
    const idx = todasDatas.indexOf(data);
    if (todasDatas.length <= 1) return padLeft;
    return padLeft + (idx / (todasDatas.length - 1)) * innerW;
  };
  const yFor = (valor: number) => padTop + innerH - (valor / maxValor) * innerH;

  function expandir(pontos: { data: string; valor: number }[]) {
    const map = new Map(pontos.map((p) => [p.data, p.valor]));
    let last = 0;
    return todasDatas.map((data) => {
      if (map.has(data)) last = map.get(data)!;
      return { data, valor: last };
    });
  }

  function pathFor(pontos: { data: string; valor: number }[]) {
    return pontos
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.data).toFixed(1)} ${yFor(p.valor).toFixed(1)}`)
      .join(" ");
  }

  const yTicks = [0, 0.5, 1].map((f) => Math.round(maxValor * f));

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={yFor(t)}
              y2={yFor(t)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text x={0} y={yFor(t) + 3} fontSize={9} fill="#94a3b8">
              {t}
            </text>
          </g>
        ))}

        {comDados.map((s) => (
          <path
            key={s.id}
            d={pathFor(expandir(s.pontos))}
            fill="none"
            stroke={cores[s.id] ?? "#64748b"}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        <text x={padLeft} y={height - 6} fontSize={9} fill="#94a3b8">
          {formatarDataCurta(todasDatas[0])}
        </text>
        <text x={width - padRight} y={height - 6} fontSize={9} fill="#94a3b8" textAnchor="end">
          {formatarDataCurta(todasDatas[todasDatas.length - 1])}
        </text>
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {comDados.map((s) => {
          const ultimo = s.pontos[s.pontos.length - 1];
          return (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cores[s.id] ?? "#64748b" }}
              />
              {s.label}
              <span className="font-semibold text-slate-900">
                {formatarNumero(ultimo.valor, 0)} m²
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
