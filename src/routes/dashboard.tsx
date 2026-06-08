import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Star, TrendingUp, Quote, UserPlus, Copy, Check, MessageCircle, Mail } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  respondent_id: string | null;
};

type Respondent = {
  id: string;
  name: string;
  token: string;
  created_at: string;
};

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];

function generateToken() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function Dashboard() {
  const [data, setData] = useState<Feedback[]>([]);
  const [respondents, setRespondents] = useState<Respondent[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [{ data: fbs }, { data: rs }] = await Promise.all([
        supabase.from("feedbacks").select("*").order("created_at", { ascending: false }),
        supabase.from("respondents").select("*").order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      setData((fbs ?? []) as Feedback[]);
      setRespondents((rs ?? []) as Respondent[]);
      setLoading(false);
    };
    load();
    const channel = supabase
      .channel("portal-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedbacks" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "respondents" }, load)
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

  const submittedIds = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => d.respondent_id && s.add(d.respondent_id));
    return s;
  }, [data]);

  const kpis = [
    { label: "Total de Respostas", value: String(total), icon: Users, hint: "Nutricionistas participantes" },
    { label: "Nota Média de Satisfação", value: avg ? `${avg.toFixed(1)}/5` : "–/5", icon: Star, hint: "Média das 4 métricas avaliativas" },
    { label: "Taxa de Aceitação", value: `${acceptance}%`, icon: TrendingUp, hint: "Respostas Sim + Talvez" },
  ];

  const hasData = total > 0;
  const hasAdoption = adoption.some((a) => a.value > 0);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Informe o nome do nutricionista.");
      return;
    }
    setCreating(true);
    const token = generateToken();
    const { error } = await supabase.from("respondents").insert({ name, token });
    setCreating(false);
    if (error) {
      toast.error("Não foi possível criar o usuário.");
      return;
    }
    toast.success("Usuário criado. Link único gerado.");
    setNewName("");
    setDialogOpen(false);
  };

  const linkFor = (token: string) => {
    if (typeof window === "undefined") return `/f/${token}`;
    return `${window.location.origin}/f/${token}`;
  };

  const copyLink = async (r: Respondent) => {
    try {
      await navigator.clipboard.writeText(linkFor(r.token));
      setCopiedId(r.id);
      toast.success(`Link de ${r.name} copiado.`);
      setTimeout(() => setCopiedId((c) => (c === r.id ? null : c)), 1500);
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

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

      <section className="mb-8">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Usuários</CardTitle>
              <CardDescription>
                Cada nutricionista recebe um link único de feedback, válido para um único envio.
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> Novo usuário</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar nutricionista</DialogTitle>
                  <DialogDescription>
                    Informe o nome do participante. Um link único de feedback será gerado automaticamente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="user-name">Nome</Label>
                  <Input
                    id="user-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex.: Dra. Marina Souza"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? "Criando…" : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {respondents.length === 0 ? (
              <div className="flex h-[140px] items-center justify-center rounded-lg border border-dashed border-border bg-accent/20">
                <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Link único</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {respondents.map((r) => {
                    const done = submittedIds.has(r.id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          {done ? (
                            <Badge>Respondido</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="gap-2" onClick={() => copyLink(r)}>
                            {copiedId === r.id ? (
                              <><Check className="h-4 w-4" /> Copiado</>
                            ) : (
                              <><Copy className="h-4 w-4" /> Copiar link</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
