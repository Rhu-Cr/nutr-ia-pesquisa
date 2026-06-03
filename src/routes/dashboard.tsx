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

// Simulated data — 18 nutritionists
const distribution = [
  { nota: "1", "Experiência": 0, "Facilidade": 0, "Auxílio IA": 1, "Confiabilidade": 1 },
  { nota: "2", "Experiência": 1, "Facilidade": 1, "Auxílio IA": 1, "Confiabilidade": 2 },
  { nota: "3", "Experiência": 2, "Facilidade": 3, "Auxílio IA": 2, "Confiabilidade": 3 },
  { nota: "4", "Experiência": 7, "Facilidade": 6, "Auxílio IA": 6, "Confiabilidade": 7 },
  { nota: "5", "Experiência": 8, "Facilidade": 8, "Auxílio IA": 8, "Confiabilidade": 5 },
];

const adoption = [
  { name: "Sim, com certeza", value: 11 },
  { name: "Talvez (ajustes)", value: 6 },
  { name: "Não", value: 1 },
];

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

const feedbacks = [
  { tipo: "Ponto forte", autor: "Nutricionista clínica", texto: "A geração automática de planos alimentares personalizados em segundos é simplesmente revolucionária para a rotina do consultório." },
  { tipo: "Ponto forte", autor: "Nutricionista esportiva", texto: "O cálculo automático de macros e a sugestão de substituições foram muito precisos. Senti economia real de tempo." },
  { tipo: "Sugestão", autor: "Nutricionista funcional", texto: "Seria interessante integrar com bioimpedância e adicionar uma base de receitas regionais brasileiras." },
  { tipo: "Sugestão", autor: "Nutricionista materno-infantil", texto: "Faltam protocolos específicos para gestantes e pediatria. Também sugiro exportar o plano em PDF com a identidade visual do profissional." },
];

const kpis = [
  { label: "Total de Respostas", value: "18", icon: Users, hint: "Nutricionistas participantes" },
  { label: "Nota Média de Satisfação", value: "4.6/5", icon: Star, hint: "Média das 4 métricas avaliativas" },
  { label: "Taxa de Aceitação", value: "94%", icon: TrendingUp, hint: "Respostas Sim + Talvez" },
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
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="nota" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Experiência" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Facilidade" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Auxílio IA" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Confiabilidade" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Adoção Profissional</CardTitle>
            <CardDescription>Intenção de uso na rotina clínica.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={adoption} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {adoption.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
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
            <div className="grid gap-4 md:grid-cols-2">
              {feedbacks.map((f, i) => (
                <div key={i} className="relative rounded-lg border border-border bg-accent/30 p-5">
                  <Quote className="absolute right-4 top-4 h-5 w-5 text-primary/30" />
                  <Badge variant={f.tipo === "Ponto forte" ? "default" : "secondary"} className="mb-3">
                    {f.tipo}
                  </Badge>
                  <p className="text-sm leading-relaxed text-foreground">"{f.texto}"</p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">— {f.autor}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
