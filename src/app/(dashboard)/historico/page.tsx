"use client";

import { useState, useCallback } from "react";
import {
  Search, ChevronDown, ChevronRight, FileText, Users, Eye, Loader2,
  HardHat, Shirt, Package,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { generateDeliveryPdf } from "~/lib/pdf";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

const typeConfig = {
  EPI: { label: "EPI", color: "border-l-blue-500", dot: "bg-blue-500", badge: "info", icon: HardHat },
  UNIFORM: { label: "Unif.", color: "border-l-emerald-500", dot: "bg-emerald-500", badge: "success", icon: Shirt },
};

function getDeliveryConfig(items: { itemType: string }[]) {
  const types = new Set(items.map((i) => i.itemType));
  if (types.size === 1) {
    const t = types.values().next().value as "EPI" | "UNIFORM";
    return {
      title: t === "EPI" ? "FICHA DE EPI" : "FICHA DE UNIFORME",
      border: typeConfig[t].color,
    };
  }
  return {
    title: "FICHA DE EPI E UNIFORME",
    border: "border-l-violet-500",
  };
}

function ItemIcon({ type }: { type: string }) {
  const config = typeConfig[type as "EPI" | "UNIFORM"];
  if (!config) return <Package className="h-4 w-4" />;
  const Icon = config.icon;
  return <Icon className="h-4 w-4" />;
}

export default function HistoricoPage() {
  const [search, setSearch] = useState("");
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: collaborators, isLoading: loadingCollabs } = api.delivery.getCollaborators.useQuery({
    search: search || undefined,
  });

  const { data: deliveryData, isLoading: loadingDeliveries } = api.delivery.list.useQuery(
    { collaboratorId: selectedCollabId ?? undefined, page, pageSize: 20 },
    { enabled: !!selectedCollabId },
  );

  const { data: fullDelivery } = api.delivery.getById.useQuery(
    downloadingId ?? "",
    { enabled: !!downloadingId },
  );

  const selectedCollab = collaborators?.find((c) => c.id === selectedCollabId);

  const handleDownload = useCallback((deliveryId: string) => {
    setDownloadingId(deliveryId);
  }, []);

  if (fullDelivery && downloadingId === fullDelivery.id) {
    const pdf = generateDeliveryPdf({
      collaboratorName: fullDelivery.collaborator.name,
      collaboratorRegistration: fullDelivery.collaborator.registration,
      manager: fullDelivery.collaborator.manager,
      operation: fullDelivery.collaborator.operation?.name ?? "",
      date: new Intl.DateTimeFormat("pt-BR").format(new Date(fullDelivery.date)),
      signature: fullDelivery.signature ?? undefined,
      items: fullDelivery.items.map((item) => ({
        itemType: item.itemType,
        itemName: item.itemName,
        size: item.size ?? undefined,
        quantity: item.quantity,
        reason: item.reason?.name ?? "",
        notes: item.notes ?? undefined,
      })),
    });
    const filename = `ficha-${fullDelivery.collaborator.registration}-${new Date(fullDelivery.createdAt).toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
    setDownloadingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Histórico de Entregas
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Selecione um colaborador para ver o histórico de entregas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white pb-4 dark:border-gray-800 dark:from-gray-800/50 dark:to-gray-800">
              <CardTitle>Colaboradores</CardTitle>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm placeholder-gray-400 transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Buscar colaborador..."
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
            <CardContent padding="none" className="max-h-[600px] overflow-y-auto">
              {loadingCollabs ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : collaborators && collaborators.length > 0 ? (
                <div>
                  {collaborators.map((collab, idx) => (
                    <button
                      key={collab.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        selectedCollabId === collab.id
                          ? "border-l-blue-500 bg-blue-50/60 dark:border-l-blue-400 dark:bg-blue-900/15"
                          : "border-l-transparent",
                        idx > 0 && "border-t border-t-gray-50 dark:border-t-gray-800",
                      )}
                      onClick={() => {
                        setSelectedCollabId(
                          selectedCollabId === collab.id ? null : collab.id,
                        );
                        setExpandedDeliveryId(null);
                        setPage(1);
                      }}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                          selectedCollabId === collab.id
                            ? "bg-blue-600 text-white"
                            : "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 dark:from-blue-900/60 dark:to-blue-800/60 dark:text-blue-300",
                        )}
                      >
                        {collab.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {collab.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          Mat. {collab.registration}
                        </p>
                      </div>
                      {selectedCollabId === collab.id && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-400">
                  <Users className="mb-2 h-8 w-8 text-gray-300" />
                  Nenhum colaborador com entregas
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              className={cn(
                "border-b border-gray-100 dark:border-gray-800",
                selectedCollabId
                  ? "bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-800"
                  : "",
              )}
            >
              {selectedCollab ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                    {selectedCollab.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                      {selectedCollab.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      Mat. {selectedCollab.registration}
                    </p>
                  </div>
                </div>
              ) : (
                <CardTitle className="text-base">Detalhes</CardTitle>
              )}
            </CardHeader>
            <CardContent padding="none">
              {!selectedCollabId ? (
                <div className="flex flex-col items-center justify-center py-20 text-sm text-gray-400">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <Users className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="font-medium text-gray-500">Nenhum colaborador selecionado</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Escolha um nome na lista ao lado para ver as entregas
                  </p>
                </div>
              ) : loadingDeliveries ? (
                <div className="space-y-1 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : deliveryData && deliveryData.deliveries.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {deliveryData.deliveries.map((delivery) => {
                    const isOpen = expandedDeliveryId === delivery.id;
                    const { title, border } = getDeliveryConfig(delivery.items);
                    const dateStr = formatDate(delivery.createdAt);
                    const hasEpi = delivery.items.some((i) => i.itemType === "EPI");
                    const hasUniform = delivery.items.some((i) => i.itemType === "UNIFORM");

                    return (
                      <div key={delivery.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-3 border-l-2 px-6 py-4 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50",
                            isOpen ? border : "border-l-transparent",
                          )}
                          onClick={() =>
                            setExpandedDeliveryId(
                              expandedDeliveryId === delivery.id ? null : delivery.id,
                            )
                          }
                        >
                          <div className="shrink-0 text-gray-300 transition-transform duration-200 dark:text-gray-600">
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
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {delivery.items.length} item(ns)
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <div className="flex gap-1.5">
                                {hasEpi && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                    <HardHat className="h-2.5 w-2.5" />
                                    EPI
                                  </span>
                                )}
                                {hasUniform && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                    <Shirt className="h-2.5 w-2.5" />
                                    Unif.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-xs text-gray-400 tabular-nums">
                            {dateStr}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/30">
                            <div>
                              <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                                  Itens retirados
                                </p>
                                <button
                                  type="button"
                                  title="Baixar ficha"
                                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-white hover:text-gray-700 hover:shadow-sm dark:hover:bg-gray-800 dark:hover:text-gray-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(delivery.id);
                                  }}
                                >
                                  {downloadingId === delivery.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <FileText className="h-3.5 w-3.5" />
                                  )}
                                  Baixar
                                </button>
                              </div>
                              <div className="space-y-2">
                                {delivery.items.map((item) => {
                                  const cfg = typeConfig[item.itemType as "EPI" | "UNIFORM"];
                                  return (
                                    <div
                                      key={item.id}
                                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                                    >
                                      <div
                                        className={cn(
                                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                          item.itemType === "EPI"
                                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                            : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
                                        )}
                                      >
                                        <ItemIcon type={item.itemType} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.itemName}
                                          {item.size && (
                                            <span className="ml-1 font-normal text-gray-400">
                                              ({item.size})
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {item.reason?.name ?? ""}
                                        </p>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-3">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                          x{item.quantity}
                                        </span>
                                        {cfg && (
                                          <Badge
                                            variant={cfg.badge as "info" | "success"}
                                            className="hidden sm:inline-flex"
                                          >
                                            {cfg.label}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-sm text-gray-400">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                    <Eye className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="font-medium text-gray-500">Nenhuma entrega encontrada</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Este colaborador ainda não possui registros
                  </p>
                </div>
              )}
            </CardContent>

            {deliveryData && deliveryData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 dark:border-gray-800">
                <p className="text-xs text-gray-400">
                  Página {deliveryData.page} de {deliveryData.totalPages} · {deliveryData.total} registros
                </p>
                <div className="flex gap-1.5">
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