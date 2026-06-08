import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, LinkIcon, LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nutr.IA – Portal de Feedback" },
      { name: "description", content: "Portal de coleta e análise de feedback do protótipo Nutr.IA." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Leaf className="h-4 w-4" /> Pesquisa de TCC – Engenharia de Software
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Portal de Feedback Nutr.IA
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Este portal coleta as avaliações dos nutricionistas que testaram o protótipo Nutr.IA
          e exibe os resultados consolidados para a banca examinadora.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Sou nutricionista</h2>
            <p className="text-sm text-muted-foreground">
              O acesso ao formulário é feito exclusivamente pelo link único enviado a você.
              Cada link permite apenas um envio.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold">Sou pesquisador</h2>
            <p className="text-sm text-muted-foreground">
              Acesse o painel analítico diretamente em{" "}
              <Link to="/dashboard" className="font-medium text-primary underline-offset-4 hover:underline">
                /dashboard
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
