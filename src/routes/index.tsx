import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Leaf, Send, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { submitFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Formulário de Feedback – Nutr.IA" },
      { name: "description", content: "Coleta de feedback de nutricionistas sobre o protótipo Nutr.IA." },
    ],
  }),
  component: FormPage,
});

const scaleLabels: Record<string, [string, string]> = {
  exp: ["Muito Ruim", "Excelente"],
  use: ["Muito Difícil", "Muito Fácil"],
  ia: ["Não Ajudou", "Ajudou Muito"],
  conf: ["Totalmente Incoerentes", "Totalmente Confiáveis"],
};

const questions: { id: keyof typeof scaleLabels; title: string; q: string }[] = [
  { id: "exp", title: "1. Experiência Geral", q: "Como você avalia sua experiência geral com o Nutr.IA?" },
  { id: "use", title: "2. Usabilidade (Facilidade)", q: "O quão fácil e intuitivo foi navegar e utilizar a plataforma?" },
  { id: "ia", title: "3. Eficiência da Inteligência Artificial", q: "O quanto as sugestões e automações geradas pela IA auxiliaram na velocidade/qualidade das atividades?" },
  { id: "conf", title: "4. Confiabilidade Clínica", q: "O quão confiáveis e coerentes foram as respostas/planos gerados pela IA para a prática nutricional?" },
];

function ScaleField({ id, min, max, value, onChange }: { id: string; min: string; max: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            htmlFor={`${id}-${n}`}
            className="flex flex-1 min-w-[60px] cursor-pointer flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <RadioGroupItem id={`${id}-${n}`} value={String(n)} className="sr-only" />
            <span className="text-lg font-semibold">{n}</span>
          </label>
        ))}
      </RadioGroup>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function FormPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scales, setScales] = useState<Record<string, string>>({});
  const [adoption, setAdoption] = useState("");
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = useServerFn(submitFeedback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["exp", "use", "ia", "conf"] as const;
    if (!name.trim() || !email.trim()) {
      toast.error("Por favor, informe seu nome e e-mail.");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (required.some((k) => !scales[k]) || !adoption) {
      toast.error("Por favor, responda todas as perguntas obrigatórias (1 a 5).");
      return;
    }
    setSubmitting(true);
    try {
      await submit({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          exp: Number(scales.exp),
          use: Number(scales.use),
          ia: Number(scales.ia),
          conf: Number(scales.conf),
          adoption: adoption as "sim" | "talvez" | "nao",
          liked: liked.trim() || null,
          improve: improve.trim() || null,
        },
      });
      setSubmitted(true);
      toast.success("Feedback enviado com sucesso! Obrigado pela colaboração.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível enviar. Tente novamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };




  if (submitted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card className="border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Feedback registrado!</h2>
            <p className="text-muted-foreground">
              Sua contribuição é fundamental para a evolução do Nutr.IA e para a pesquisa de TCC.
            </p>
            <Button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setScales({}); setAdoption(""); setLiked(""); setImprove(""); }} variant="outline">
              Enviar outra resposta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4" /> Protótipo de Pesquisa
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Formulário de Feedback – Nutr.IA</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Olá! Obrigado por participar dos testes do Nutr.IA (Protótipo de IA para Nutrição). Seu feedback como
          profissional é fundamental para validar nossa pesquisa de Engenharia de Software. Este formulário leva menos
          de 3 minutos.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
            <CardDescription>
              Usado apenas para evitar respostas duplicadas. Seus dados não aparecem no dashboard público.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={120} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" maxLength={255} required />
              <p className="text-xs text-muted-foreground">Permitida apenas uma resposta por e-mail.</p>
            </div>
          </CardContent>
        </Card>

        {questions.map((q) => (

          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-base">{q.title}</CardTitle>
              <CardDescription>{q.q}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScaleField
                id={q.id}
                min={scaleLabels[q.id][0]}
                max={scaleLabels[q.id][1]}
                value={scales[q.id] ?? ""}
                onChange={(v) => setScales((s) => ({ ...s, [q.id]: v }))}
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">5. Adoção Profissional</CardTitle>
            <CardDescription>Você utilizaria o Nutr.IA na sua rotina diária de atendimento se estivesse totalmente disponível no mercado?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={adoption} onValueChange={setAdoption} className="space-y-2">
              {[
                { v: "sim", l: "Sim, com certeza" },
                { v: "talvez", l: "Talvez (precisaria de ajustes)" },
                { v: "nao", l: "Não" },
              ].map((opt) => (
                <Label
                  key={opt.v}
                  htmlFor={`adop-${opt.v}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem id={`adop-${opt.v}`} value={opt.v} />
                  <span className="font-normal">{opt.l}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">6. Funcionalidade de Maior Impacto</CardTitle>
            <CardDescription>Qual funcionalidade ou aspecto da plataforma você mais gostou ou achou mais inovador?</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={liked} onChange={(e) => setLiked(e.target.value)} rows={3} placeholder="Compartilhe o que mais te marcou..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">7. Melhorias para Próximas Versões</CardTitle>
            <CardDescription>Qual melhoria, correção ou nova funcionalidade você considera prioritária?</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea value={improve} onChange={(e) => setImprove(e.target.value)} rows={3} placeholder="Sugestões e melhorias..." />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
          <Send className="h-4 w-4" /> {submitting ? "Enviando…" : "Enviar Feedback"}
        </Button>
      </form>
    </div>
  );
}
