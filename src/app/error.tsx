"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6 pt-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger" />
          <h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
          <p className="text-sm text-secondary">{error.message}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => reset()}>Tentar novamente</Button>
            <Button variant="outline" asChild>
              <Link href="/">Voltar ao início</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
