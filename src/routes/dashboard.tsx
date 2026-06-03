import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users, Star, TrendingUp, Quote } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de Resultados – Nutr.IA" },
      { name: "description", content: "Resultados analíticos do feedback dos nutricionistas." },
    ],
  }),
  component: Dashboard,
});

// Dados reais — inicialmente vazios (aguardando coleta)
const distribution = [
  { nota: "1", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 },
  { nota: "2", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 },
  { nota: "3", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 },
  { nota: "4", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 },
  { nota: "5", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 0, "Confiabilidade": 0 },
];

const adoption = [
  { name: "Sim, com certeza", value: 0 },
  { name: "Talvez (ajustes)", value: 0 },
  { name: "Não", value: 0 },
];

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

const feedbacks: { tipo: string; autor: string; texto: string }[] = [];

const kpis = [
  { label: "Total de Respostas", value: "0", icon: Users, hint: "Nutricionistas participantes" },
  { label: "Nota Média de Satisfação", value: "–/5", icon: Star, hint: "Média das 4 métricas avaliativas" },
  { label: "Taxa de Aceitação", value: "0%", icon: TrendingUp, hint: "Respostas Sim + Talvez" },
];

function Dashboard() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard de Resultados</h1>
        <p className="mt-2 text-muted-foreground">
          Análise consolidada do feedback dos nutricionistas que testaram o protótipo Nutr.IA.
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
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
              <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Adoção Profissional</CardTitle>
            <CardDescription>Intenção de uso na rotina clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
              <p className="text-sm text-muted-foreground">Aguardando respostas…</p>
            </div>
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
            <div className="flex h-[160px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
              <p className="text-sm text-muted-foreground">Nenhum feedback qualitativo registrado ainda.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
