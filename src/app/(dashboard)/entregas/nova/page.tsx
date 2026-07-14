"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Shirt,
  PenLine,
  User,
  Package,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { generateDeliveryPdf } from "~/lib/pdf";
import { StepIndicator } from "./step-indicator";
import { SelectionCard } from "./selection-card";
import { ItemForm } from "./item-form";
import { ItemTable } from "./item-table";
import { ItemTableEmpty } from "./item-table";
import type { CartItem, CollaboratorData, NewItemForm } from "./types";
import { ITEM_TYPE_CONFIG } from "./types";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-teal-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}

const INITIAL_NEW_ITEM: NewItemForm = {
  itemType: "EPI",
  itemId: "",
  itemName: "",
  size: "",
  quantity: 1,
  reasonId: "",
  notes: "",
};

const QUERY_STALE = 5 * 60 * 1000;

function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Desconhecido";
}

function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorData | null>(null);
  const [addEpis, setAddEpis] = useState<boolean | null>(null);
  const [addUniforms, setAddUniforms] = useState<boolean | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>(INITIAL_NEW_ITEM);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data: searchResults } = api.collaborator.search.useQuery(
    { search: debouncedSearch || undefined },
    { enabled: debouncedSearch.length > 0 },
  );

  const { data: defaultList, isFetching: isDefaultListLoading } = api.collaborator.list.useQuery(
    { pageSize: 50 },
    { enabled: isSearchFocused && search.length === 0 && !selectedCollaborator, staleTime: 60_000 },
  );

  const { data: epis, isLoading: episLoading } = api.epi.list.useQuery(undefined, {
    staleTime: QUERY_STALE,
  });

  const { data: uniforms, isLoading: uniformsLoading } = api.uniform.list.useQuery(undefined, {
    staleTime: QUERY_STALE,
  });

  const { data: reasons } = api.reason.list.useQuery(undefined, {
    staleTime: QUERY_STALE,
  });

  const createDelivery = api.delivery.create.useMutation();
  const uploadPdf = api.delivery.uploadPdf.useMutation();

  const episInCart = useMemo(() => cart.filter((i) => i.itemType === "EPI"), [cart]);
  const uniformsInCart = useMemo(() => cart.filter((i) => i.itemType === "UNIFORM"), [cart]);
  const hasEpi = addEpis === true || episInCart.length > 0;
  const hasUniform = addUniforms === true || uniformsInCart.length > 0;

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0]!.clientX - rect.left : e.clientX - rect.left;
      const y = "touches" in e ? e.touches[0]!.clientY - rect.top : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0]!.clientX - rect.left : e.clientX - rect.left;
      const y = "touches" in e ? e.touches[0]!.clientY - rect.top : e.clientY - rect.top;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#2563eb";
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing],
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignature(canvas.toDataURL());
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setHighlightedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const previewCollaborators = useMemo(() => {
    if (search.length > 0 && searchResults) return searchResults;
    if (isSearchFocused && search.length === 0 && defaultList?.collaborators) {
      return defaultList.collaborators;
    }
    return null;
  }, [search, searchResults, isSearchFocused, defaultList]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!previewCollaborators || previewCollaborators.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, previewCollaborators.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = previewCollaborators[highlightedIndex];
        if (selected) {
          setSelectedCollaborator(selected as unknown as CollaboratorData);
          setSearch("");
          setDebouncedSearch("");
          setHighlightedIndex(-1);
          setIsSearchFocused(false);
        }
      } else if (e.key === "Escape") {
        setHighlightedIndex(-1);
        setIsSearchFocused(false);
      }
    },
    [previewCollaborators, highlightedIndex],
  );

  const clearSearch = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setHighlightedIndex(-1);
  }, []);

  const handleNewItemChange = useCallback((updates: Partial<NewItemForm>) => {
    setNewItem((prev) => ({ ...prev, ...updates }));
  }, []);

  const addToCart = useCallback(
    (itemType: "EPI" | "UNIFORM") => {
      if (!newItem.itemId || !newItem.reasonId) {
        toast.error("Selecione o item e o motivo");
        return;
      }
      const list = itemType === "EPI" ? epis : uniforms;
      const selected = list?.find((i) => i.id === newItem.itemId);
      const reason = reasons?.find((r) => r.id === newItem.reasonId);
      setCart((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          itemType,
          itemName: selected?.name ?? newItem.itemName,
          size: newItem.size,
          quantity: newItem.quantity,
          reasonId: newItem.reasonId,
          reasonName: reason?.name ?? "",
          notes: newItem.notes,
        },
      ]);
      setNewItem({ ...INITIAL_NEW_ITEM, itemType });
    },
    [newItem, epis, uniforms, reasons],
  );

  const removeFromCart = useCallback(
    (id: string) => setCart((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedCollaborator) return;
    if (!signature) {
      toast.error("Assinatura é obrigatória");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }
    setSubmitting(true);

    const deviceType = detectDeviceType();
    let geoLatitude: number | undefined;
    let geoLongitude: number | undefined;
    try {
      const pos = await getCurrentPosition({ timeout: 8000, enableHighAccuracy: false });
      geoLatitude = pos.coords.latitude;
      geoLongitude = pos.coords.longitude;
    } catch {
      // geolocation unavailable or denied - proceed without it
    }

    try {
      const delivery = await createDelivery.mutateAsync({
        collaboratorId: selectedCollaborator.id,
        date: new Date().toISOString(),
        items: cart.map((item) => ({
          itemType: item.itemType,
          itemName: item.itemName,
          size: item.size || undefined,
          quantity: item.quantity,
          reasonId: item.reasonId,
          notes: item.notes || undefined,
        })),
        signature,
        deviceType,
        geoLatitude,
        geoLongitude,
      });

      const reasonsMap = Object.fromEntries((reasons ?? []).map((r) => [r.id, r.name]));
      const dateStr = new Intl.DateTimeFormat("pt-BR").format(new Date());

      const pdf = generateDeliveryPdf({
        collaboratorName: selectedCollaborator.name,
        collaboratorRegistration: selectedCollaborator.registration,
        collaboratorRole: selectedCollaborator.role ?? undefined,
        manager: selectedCollaborator.manager,
        operation: selectedCollaborator.operation.name,
        date: dateStr,
        signature,
        deviceType,
        geoLatitude,
        geoLongitude,
        items: cart.map((item) => ({
          itemType: item.itemType,
          itemName: item.itemName,
          size: item.size,
          quantity: item.quantity,
          reason: item.reasonName || (reasonsMap[item.reasonId] ?? ""),
          notes: item.notes,
        })),
      });

      await uploadPdf.mutateAsync({
        deliveryId: delivery.id,
        pdfBase64: pdf.output("datauristring"),
        fileName: `ficha-${new Date().toISOString().split("T")[0]}.pdf`,
      });

      toast.success("Entrega registrada com sucesso!");
      router.push("/historico");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar entrega");
    } finally {
      setSubmitting(false);
    }
  }, [selectedCollaborator, signature, cart, createDelivery, uploadPdf, reasons, router]);

  const nextStep = useCallback(() => setStep((s) => s + 1), []);
  const prevStep = useCallback(() => setStep((s) => s - 1), []);

  const isSearching = search.length > 0 && (debouncedSearch !== search || searchResults === undefined);
  const hasPreview = previewCollaborators !== null && previewCollaborators.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Nova Entrega
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Registro de entrega de EPIs e Uniformes
          </p>
        </div>
      </div>

      <StepIndicator current={step} hasEpi={hasEpi} hasUniform={hasUniform} />

      <div className="transition-opacity duration-200">
        {step === 1 && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader>
              <CardTitle>Selecionar Colaborador</CardTitle>
              <CardDescription>
                Pesquise pelo nome ou matrícula do colaborador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedCollaborator && (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-[0.6rem] z-10 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Nome ou matrícula..."
                      value={search}
                      onChange={handleSearchChange}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10 pr-10"
                    />
                    {search.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-3 top-[0.6rem] z-10 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Limpar busca"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {hasPreview && (
                    <div className="max-h-80 overflow-auto rounded-xl border dark:border-gray-700">
                      {previewCollaborators!.map((c, idx) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                            idx === highlightedIndex
                              ? "bg-blue-50 dark:bg-blue-950/40"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          } ${idx > 0 ? "border-t border-gray-100 dark:border-gray-700" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedCollaborator(c as unknown as CollaboratorData);
                        setSearch("");
                        setDebouncedSearch("");
                        setHighlightedIndex(-1);
                        setIsSearchFocused(false);
                      }}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(c.name)}`}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-gray-900 dark:text-white">
                              {c.name}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {c.registration}
                              {c.role ? ` · ${c.role}` : ""}
                            </p>
                          </div>
                          <Badge variant="info" className="shrink-0 text-xs">
                            {c.operation.name}
                          </Badge>
                        </button>
                      ))}
                      {search.length === 0 && defaultList && defaultList.total > 50 && (
                        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-700">
                          Mostrando 50 de {defaultList.total} colaboradores. Continue digitando para filtrar.
                        </div>
                      )}
                    </div>
                  )}

                  {isSearchFocused && search.length === 0 && (defaultList?.collaborators ?? []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
                      <User className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-500" />
                      <p className="mt-3 text-sm font-medium text-gray-500">
                        Nenhum colaborador cadastrado
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Cadastre colaboradores antes de criar uma entrega
                      </p>
                    </div>
                  )}

                  {search.length > 0 && !isSearching && searchResults?.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-600">
                      <User className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-500" />
                      <p className="mt-3 text-sm font-medium text-gray-500">
                        Nenhum colaborador encontrado
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Verifique o nome ou matrícula digitados
                      </p>
                    </div>
                  )}
                </>
              )}

              {selectedCollaborator && (
                <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-900 dark:from-blue-950/30 dark:to-gray-800">
                  <div className="mb-4 flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${getAvatarColor(selectedCollaborator.name)}`}>
                      {selectedCollaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedCollaborator.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Matrícula: {selectedCollaborator.registration}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
                    {[
                      { label: "Cargo", value: selectedCollaborator.role ?? "—" },
                      { label: "Gestor", value: selectedCollaborator.manager },
                      { label: "Operação", value: selectedCollaborator.operation.name },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-xs text-gray-500">{f.label}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                      <Check className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Colaborador selecionado
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setSelectedCollaborator(null)}
                    >
                      <Search className="h-3.5 w-3.5" /> Trocar
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end border-t pt-4 dark:border-gray-700">
                <Button
                  disabled={!selectedCollaborator}
                  onClick={() => {
                    setAddEpis(null);
                    setAddUniforms(null);
                    nextStep();
                  }}
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && addEpis === null && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader>
              <CardTitle>Entregar EPIs?</CardTitle>
              <CardDescription>
                O colaborador vai receber Equipamentos de Proteção Individual?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SelectionCard
                title="Sim, entregar EPIs"
                description="Selecionar EPIs, tamanhos e motivos"
                icon={HardHat}
                onSelect={() => {
                  setAddEpis(true);
                  setNewItem({ ...INITIAL_NEW_ITEM, itemType: "EPI" });
                }}
              />
              <SelectionCard
                title="Não, sem EPIs"
                description="Pular para entrega de Uniformes"
                icon={Package}
                onSelect={() => {
                  setAddEpis(false);
                  setAddUniforms(null);
                  nextStep();
                }}
              />
            </CardContent>
          </Card>
        )}

        {step === 2 && addEpis === true && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardContent padding="lg" className="space-y-6">
              <ItemForm
                type="EPI"
                items={epis}
                reasons={reasons}
                cartItems={episInCart}
                newItem={newItem}
                isLoading={episLoading}
                onNewItemChange={handleNewItemChange}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
              />
              <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => {
                    setAddUniforms(null);
                    setNewItem({ ...INITIAL_NEW_ITEM, itemType: "UNIFORM" });
                    nextStep();
                  }}
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && addEpis === false && addUniforms === false && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Nenhum item selecionado
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Selecione pelo menos EPI ou Uniforme para continuar
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  setAddEpis(null);
                  setAddUniforms(null);
                  setStep(2);
                }}
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && addUniforms === null && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <CardHeader>
              <CardTitle>Entregar Uniformes?</CardTitle>
              <CardDescription>
                O colaborador{addEpis ? " também" : ""} vai receber Uniformes?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SelectionCard
                title="Sim, entregar Uniformes"
                description="Selecionar uniformes, tamanhos e motivos"
                icon={Shirt}
                onSelect={() => {
                  setAddUniforms(true);
                  setNewItem({ ...INITIAL_NEW_ITEM, itemType: "UNIFORM" });
                }}
              />
              <SelectionCard
                title={addEpis ? "Não, apenas EPIs" : "Não, sem Uniformes"}
                description="Ir direto para a assinatura"
                icon={PenLine}
                onSelect={() => {
                  setAddUniforms(false);
                  nextStep();
                }}
              />
            </CardContent>
          </Card>
        )}

        {step === 3 && addUniforms === true && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600" />
            <CardContent padding="lg" className="space-y-6">
              <ItemForm
                type="UNIFORM"
                items={uniforms}
                reasons={reasons}
                cartItems={uniformsInCart}
                newItem={newItem}
                isLoading={uniformsLoading}
                onNewItemChange={handleNewItemChange}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
              />
              <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button onClick={nextStep}>
                  Próximo <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(step === 4 || step === 5 || step === 6) && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 to-violet-600" />
            <CardContent padding="lg" className="space-y-8">
              <div className="grid gap-8 lg:grid-cols-5">
                <div className="space-y-6 lg:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      <PenLine className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Termo de Responsabilidade
                      </h3>
                      <p className="text-sm text-gray-500">Revise os itens antes de assinar</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    <p>
                      Eu, <strong>{selectedCollaborator?.name}</strong>, matrícula{" "}
                      <strong>{selectedCollaborator?.registration}</strong>, declaro ter
                      recebido os Equipamentos de Proteção Individual e/ou Uniformes
                      descritos ao lado, comprometendo-me a utilizá-los corretamente
                      conforme as orientações recebidas, mantendo-os em bom estado de
                      conservação e comunicando imediatamente qualquer avaria ou
                      necessidade de substituição.
                    </p>
                  </div>

                  {cart.length > 0 ? (
                    <ItemTable items={cart} readonly />
                  ) : (
                    <ItemTableEmpty />
                  )}
                </div>

                <div className="space-y-6 lg:col-span-2">
                  <div className="rounded-xl border-2 border-dashed border-violet-300 bg-violet-50/30 p-6 dark:border-violet-800 dark:bg-violet-950/20">
                    <p className="mb-3 text-sm font-semibold text-violet-700 dark:text-violet-400">
                      Assinatura do Colaborador <span className="text-red-500">*</span>
                    </p>
                    <div className="overflow-hidden rounded-lg border-2 border-white bg-white shadow-sm dark:border-gray-700 dark:bg-white">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={200}
                        className="h-44 w-full cursor-crosshair touch-none sm:h-48"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      {signature ? (
                        <p className="flex items-center gap-1 text-sm text-emerald-600">
                          <Check className="h-4 w-4" /> Assinatura registrada
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">Desenhe no campo acima</p>
                      )}
                      <Button variant="ghost" size="sm" onClick={clearSignature}>
                        Limpar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Resumo
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Colaborador</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedCollaborator?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Matrícula</span>
                        <span className="font-mono text-gray-700 dark:text-gray-300">
                          {selectedCollaborator?.registration}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total de itens</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {cart.length} item{cart.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {episInCart.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">EPIs</span>
                          <span className="text-blue-600">{episInCart.length}</span>
                        </div>
                      )}
                      {uniformsInCart.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Uniformes</span>
                          <span className="text-emerald-600">{uniformsInCart.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t pt-4 dark:border-gray-700">
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!signature || cart.length === 0}
                  loading={submitting}
                  size="lg"
                >
                  <Check className="h-4 w-4" /> Finalizar Entrega
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}