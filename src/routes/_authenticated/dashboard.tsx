import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Star, TrendingUp, Quote, Download } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de Resultados – Nutr.IA" },
      { name: "description", content: "Resultados analíticos do feedback dos nutricionistas." },
    ],
  }),
  component: Dashboard,
});

type Feedback = {
  id: string;
  exp: number;
  use: number;
  ia: number;
  conf: number;
  adoption: "sim" | "talvez" | "nao";
  liked: string | null;
  improve: string | null;
  created_at: string;
};

const METRIC_KEYS = ["Experiência", "Facilidade", "Auxílio IA", "Confiabilidade"] as const;
const METRIC_COLORS: Record<(typeof METRIC_KEYS)[number], string> = {
  "Experiência": "var(--chart-1)",
  "Facilidade": "var(--chart-2)",
  "Auxílio IA": "var(--chart-3)",
  "Confiabilidade": "var(--chart-4)",
};
const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

const AXIS_STYLE = { fontSize: 12, fill: "var(--foreground)" } as const;
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--foreground)",
} as const;
const LABEL_STYLE = { fontSize: 11, fill: "var(--foreground)" } as const;

/** Export the SVG of a chart container to a high-resolution PNG. */
async function exportChartAsPng(container: HTMLElement | null, filename: string) {
  if (!container) return;
  const svg = container.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // Inline computed background so the exported PNG isn't transparent in articles.
  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff";
  const w = svg.clientWidth || 800;
  const h = svg.clientHeight || 400;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const xml = new XMLSerializer().serializeToString(clone);
  const svg64 = btoa(unescape(encodeURIComponent(xml)));
  const dataUrl = `data:image/svg+xml;base64,${svg64}`;
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("svg load failed"));
    img.src = dataUrl;
  });
  const scale = 3; // 3x for print/article quality
  const canvas = document.createElement("canvas");
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(img, 0, 0);
  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function Dashboard() {
  const [data, setData] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const distRef = useRef<HTMLDivElement>(null);
  const avgRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: rows } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (mounted) {
        setData((rows ?? []) as Feedback[]);
        setLoading(false);
      }
    };
    load();
    const channel = supabase
      .channel("feedbacks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedbacks" }, load)
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const total = data.length;

  const distribution = useMemo(() => {
    const base = [1, 2, 3, 4, 5].map((n) => ({
      nota: String(n),
      "Experiência": 0,
      "Facilidade": 0,
      "Auxílio IA": 0,
      "Confiabilidade": 0,
    }));
    data.forEach((d) => {
      base[d.exp - 1]["Experiência"]++;
      base[d.use - 1]["Facilidade"]++;
      base[d.ia - 1]["Auxílio IA"]++;
      base[d.conf - 1]["Confiabilidade"]++;
    });
    return base;
  }, [data]);

  const averagesByMetric = useMemo(() => {
    if (!total) return METRIC_KEYS.map((m) => ({ metrica: m, media: 0 }));
    const sums = { "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 };
    data.forEach((d) => {
      sums["Experiência"] += d.exp;
      sums["Facilidade"] += d.use;
      sums["Auxílio IA"] += d.ia;
      sums["Confiabilidade"] += d.conf;
    });
    return METRIC_KEYS.map((m) => ({ metrica: m, media: +(sums[m] / total).toFixed(2) }));
  }, [data, total]);

  const adoption = useMemo(() => {
    const counts = { sim: 0, talvez: 0, nao: 0 };
    data.forEach((d) => counts[d.adoption]++);
    return [
      { name: "Sim, com certeza", value: counts.sim },
      { name: "Talvez (ajustes)", value: counts.talvez },
      { name: "Não", value: counts.nao },
    ];
  }, [data]);

  const avg = useMemo(() => {
    if (!total) return null;
    const sum = data.reduce((acc, d) => acc + d.exp + d.use + d.ia + d.conf, 0);
    return sum / (total * 4);
  }, [data, total]);

  const acceptance = useMemo(() => {
    if (!total) return 0;
    const yes = data.filter((d) => d.adoption === "sim" || d.adoption === "talvez").length;
    return Math.round((yes / total) * 100);
  }, [data, total]);

  const feedbacks = useMemo(() => {
    const items: { tipo: string; texto: string; created_at: string }[] = [];
    data.forEach((d) => {
      if (d.liked) items.push({ tipo: "Ponto forte", texto: d.liked, created_at: d.created_at });
      if (d.improve) items.push({ tipo: "Sugestão", texto: d.improve, created_at: d.created_at });
    });
    return items.slice(0, 8);
  }, [data]);

  const kpis = [
    { label: "Total de Respostas", value: String(total), icon: Users, hint: "Nutricionistas participantes" },
    { label: "Nota Média de Satisfação", value: avg ? `${avg.toFixed(2)}/5` : "–/5", icon: Star, hint: "Média das 4 métricas avaliativas" },
    { label: "Taxa de Aceitação", value: `${acceptance}%`, icon: TrendingUp, hint: "Respostas Sim + Talvez" },
  ];

  const hasData = total > 0;
  const hasAdoption = adoption.some((a) => a.value > 0);
  const adoptionTotal = adoption.reduce((a, b) => a + b.value, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard de Resultados</h1>
        <p className="mt-2 text-muted-foreground">
          Análise consolidada do feedback dos nutricionistas que testaram o protótipo Nutr.IA.
          {loading ? " Carregando…" : " Atualiza em tempo real."}
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label} className="border-primary/20">
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{k.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <k.icon className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Average per metric — clearest single chart for an article */}
      <section className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Média de Avaliação por Métrica</CardTitle>
              <CardDescription>
                Pontuação média (1–5) atribuída pelos {total || "–"} respondentes em cada dimensão avaliada.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChartAsPng(avgRef.current, "nutria-media-por-metrica")}
              disabled={!hasData}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> PNG
            </Button>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div ref={avgRef} className="h-[340px] bg-card">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={averagesByMetric}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 24, bottom: 24 }}
                    barCategoryGap={18}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      tick={AXIS_STYLE}
                      stroke="var(--muted-foreground)"
                      label={{ value: "Média (1 a 5)", position: "insideBottom", offset: -8, style: AXIS_STYLE }}
                    />
                    <YAxis
                      dataKey="metrica"
                      type="category"
                      width={130}
                      tick={AXIS_STYLE}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(2)} / 5`, "Média"]} />
                    <Bar dataKey="media" radius={[0, 6, 6, 0]} maxBarSize={36}>
                      {averagesByMetric.map((d) => (
                        <Cell key={d.metrica} fill={METRIC_COLORS[d.metrica as (typeof METRIC_KEYS)[number]]} />
                      ))}
                      <LabelList
                        dataKey="media"
                        position="right"
                        formatter={(v: number) => v.toFixed(2)}
                        style={{ ...LABEL_STYLE, fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[340px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Distribuição de Notas por Métrica</CardTitle>
              <CardDescription>Frequência de cada nota (1–5) nas quatro dimensões avaliadas.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChartAsPng(distRef.current, "nutria-distribuicao-notas")}
              disabled={!hasData}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> PNG
            </Button>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div ref={distRef} className="h-[380px] bg-card">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 16, right: 16, left: 8, bottom: 32 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="nota"
                      tick={AXIS_STYLE}
                      stroke="var(--muted-foreground)"
                      label={{ value: "Nota atribuída", position: "insideBottom", offset: -16, style: AXIS_STYLE }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={AXIS_STYLE}
                      stroke="var(--muted-foreground)"
                      label={{ value: "Nº de respostas", angle: -90, position: "insideLeft", style: AXIS_STYLE }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--accent)", opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    {METRIC_KEYS.map((m) => (
                      <Bar key={m} dataKey={m} fill={METRIC_COLORS[m]} radius={[4, 4, 0, 0]} maxBarSize={32}>
                        <LabelList dataKey={m} position="top" style={LABEL_STYLE} formatter={(v: number) => (v ? v : "")} />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[380px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Adoção Profissional</CardTitle>
              <CardDescription>Intenção de uso na rotina clínica (n = {adoptionTotal}).</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportChartAsPng(pieRef.current, "nutria-adocao")}
              disabled={!hasAdoption}
              className="gap-2"
            >
              <Download className="h-4 w-4" /> PNG
            </Button>
          </CardHeader>
          <CardContent>
            {hasAdoption ? (
              <div ref={pieRef} className="h-[380px] bg-card">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={adoption}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                      label={({ percent, value }) =>
                        value ? `${Math.round((percent ?? 0) * 100)}% (${value})` : ""
                      }
                      labelLine={false}
                    >
                      {adoption.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number, name: string) => [`${v} resposta${v === 1 ? "" : "s"}`, name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[380px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Mural de Feedbacks Qualitativos</CardTitle>
            <CardDescription>Pontos fortes e sugestões destacadas pelos profissionais.</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbacks.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {feedbacks.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border bg-accent/20 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant={f.tipo === "Ponto forte" ? "default" : "secondary"}>{f.tipo}</Badge>
                      <Quote className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground">{f.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Nenhum feedback qualitativo registrado ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
