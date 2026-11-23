import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <Compass className="mx-auto h-14 w-14 text-tertiary" />
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="mt-2 text-secondary">A página que você procura não existe ou foi movida.</p>
        <a
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent-hover"
        >
          Voltar ao Hoje
        </a>
      </div>
    </div>
  );
}
