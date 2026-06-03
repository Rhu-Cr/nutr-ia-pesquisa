import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star, TrendingUp, Quote } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
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

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

function Dashboard() {
  const [data, setData] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

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
    { label: "Nota Média de Satisfação", value: avg ? `${avg.toFixed(1)}/5` : "–/5", icon: Star, hint: "Média das 4 métricas avaliativas" },
    { label: "Taxa de Aceitação", value: `${acceptance}%`, icon: TrendingUp, hint: "Respostas Sim + Talvez" },
  ];

  const hasData = total > 0;
  const hasAdoption = adoption.some((a) => a.value > 0);

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

      <section className="mb-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Distribuição de Notas por Métrica</CardTitle>
            <CardDescription>Comparação das avaliações de 1 a 5 nas quatro dimensões avaliadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="nota" stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="Experiência" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Facilidade" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Auxílio IA" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Confiabilidade" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Adoção Profissional</CardTitle>
            <CardDescription>Intenção de uso na rotina clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAdoption ? (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={adoption} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} label={(e) => `${Math.round((e.percent ?? 0) * 100)}%`}>
                      {adoption.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
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
