"use client";

import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error.message || "Ocorreu um erro inesperado. Tente novamente."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">
            Erro: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-6">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
