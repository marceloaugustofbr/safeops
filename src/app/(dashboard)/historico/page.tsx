"use client";

import { useState } from "react";
import { Search, FileText, Eye } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export default function HistoricoPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: deliveries, isLoading } = api.delivery.list.useQuery({
    search: search || undefined,
  });

  const { data: selectedDelivery } = api.delivery.getById.useQuery(
    selectedId ?? "",
    { enabled: !!selectedId },
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Histórico de Entregas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registro completo de todas as entregas realizadas
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Pesquisar por nome ou matrícula do colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Entregas</CardTitle>
            </CardHeader>
            <CardContent padding="none">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : deliveries && deliveries.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deliveries.map((delivery) => (
                    <button
                      key={delivery.id}
                      type="button"
                      className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedId === delivery.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedId(
                          selectedId === delivery.id ? null : delivery.id,
                        )
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {delivery.collaborator.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Mat. {delivery.collaborator.registration} •{" "}
                          {delivery.items.length} item(ns)
                        </p>
                      </div>
                      <div className="ml-4 text-right text-sm text-gray-500">
                        <p>
                          {new Intl.DateTimeFormat("pt-BR").format(
                            delivery.date,
                          )}
                        </p>
                        <p className="text-xs">
                          {new Intl.DateTimeFormat("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(delivery.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma entrega encontrada
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDelivery ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Colaborador</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedDelivery.collaborator.name}
                    </p>
                    <p className="font-mono text-sm text-gray-500">
                      {selectedDelivery.collaborator.registration}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Data</p>
                    <p className="text-sm">
                      {new Intl.DateTimeFormat("pt-BR").format(
                        selectedDelivery.date,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-gray-500">Itens</p>
                    <div className="space-y-2">
                      {selectedDelivery.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {item.itemName}
                              {item.size && ` (${item.size})`}
                            </span>
                            <Badge variant="default">
                              {item.itemType === "EPI" ? "EPI" : "Unif."}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            x{item.quantity} • {item.reason?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedDelivery.attachments.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs text-gray-500">Documentos</p>
                      {selectedDelivery.attachments.map((att) => (
                        <div key={att.id} className="space-y-1">
                          {att.type === "PDF" && (
                            <a
                              href={att.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {att.fileName}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedDelivery.signature && (
                    <div>
                      <p className="mb-1 text-xs text-gray-500">Assinatura</p>
                      <Image
                        src={selectedDelivery.signature}
                        alt="Assinatura do colaborador"
                        width={400}
                        height={100}
                        className="max-h-24 w-auto rounded border bg-white object-contain dark:border-gray-700"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Eye className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  Selecione uma entrega para ver detalhes
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
