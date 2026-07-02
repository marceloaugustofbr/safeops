"use client";

import { useState } from "react";
import {
  Search, ChevronDown, ChevronRight, FileText, Download, Users, Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function getDeliveryTitle(items: { itemType: string }[]) {
  const types = new Set(items.map((i) => i.itemType));
  if (types.size === 1) {
    const type = types.values().next().value;
    return type === "EPI" ? "FICHA DE EPI" : "FICHA DE UNIFORME";
  }
  return "FICHA DE EPI E UNIFORME";
}

export default function HistoricoPage() {
  const [search, setSearch] = useState("");
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: collaborators, isLoading: loadingCollabs } = api.delivery.getCollaborators.useQuery({
    search: search || undefined,
  });

  const { data: deliveryData, isLoading: loadingDeliveries } = api.delivery.list.useQuery(
    { collaboratorId: selectedCollabId ?? undefined, page, pageSize: 20 },
    { enabled: !!selectedCollabId },
  );

  const selectedCollab = collaborators?.find((c) => c.id === selectedCollabId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Histórico de Entregas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecione um colaborador para ver o histórico de entregas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Colaboradores</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedCollabId(null);
                    setExpandedDeliveryId(null);
                    setPage(1);
                  }}
                />
              </div>
            </CardHeader>
            <CardContent padding="none">
              {loadingCollabs ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : collaborators && collaborators.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {collaborators.map((collab) => (
                    <button
                      key={collab.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                        selectedCollabId === collab.id && "bg-blue-50 dark:bg-blue-900/20",
                      )}
                      onClick={() => {
                        setSelectedCollabId(
                          selectedCollabId === collab.id ? null : collab.id,
                        );
                        setExpandedDeliveryId(null);
                        setPage(1);
                      }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {collab.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {collab.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mat. {collab.registration}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhum colaborador com entregas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedCollab ? `Entregas de ${selectedCollab.name}` : "Detalhes"}
              </CardTitle>
            </CardHeader>
            <CardContent padding="none">
              {!selectedCollabId ? (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
                  <Users className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p>Selecione um colaborador ao lado</p>
                  <p className="text-xs text-gray-400">
                    para visualizar o histórico de entregas
                  </p>
                </div>
              ) : loadingDeliveries ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : deliveryData && deliveryData.deliveries.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deliveryData.deliveries.map((delivery) => {
                    const isOpen = expandedDeliveryId === delivery.id;
                    const title = getDeliveryTitle(delivery.items);
                    const dateStr = formatDate(delivery.createdAt);

                    return (
                      <div key={delivery.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() =>
                            setExpandedDeliveryId(
                              expandedDeliveryId === delivery.id ? null : delivery.id,
                            )
                          }
                        >
                          <div className="shrink-0 text-gray-400">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {delivery.items.length} item(ns)
                            </p>
                          </div>
                          <div className="shrink-0 text-right text-sm text-gray-500 tabular-nums">
                            {dateStr}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                            <div className="mb-3">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                                Itens retirados
                              </p>
                              <div className="space-y-1.5">
                                {delivery.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                                  >
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {item.quantity}x {item.itemName}
                                      {item.size && ` (${item.size})`}
                                    </span>
                                    <Badge
                                      variant={item.itemType === "EPI" ? "info" : "default"}
                                      className="ml-auto"
                                    >
                                      {item.itemType === "EPI" ? "EPI" : "Unif."}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {delivery.attachments.filter((a) => a.type === "PDF").length > 0 && (
                              <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                                  Documentos
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {delivery.attachments
                                    .filter((a) => a.type === "PDF")
                                    .map((att) => (
                                      <a
                                        key={att.id}
                                        href={att.cloudinaryUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-blue-600 transition-colors hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                      >
                                        <FileText className="h-3.5 w-3.5" />
                                        {att.fileName}
                                        <Download className="h-3 w-3" />
                                      </a>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-500">
                  <Eye className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p>Nenhuma entrega encontrada</p>
                  <p className="text-xs text-gray-400">
                    este colaborador ainda não possui registros
                  </p>
                </div>
              )}
            </CardContent>

            {deliveryData && deliveryData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Página {deliveryData.page} de {deliveryData.totalPages} ({deliveryData.total} registros)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= deliveryData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}