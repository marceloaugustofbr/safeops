"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import type { RouterOutputs } from "~/trpc/react";

type CollaboratorData = RouterOutputs["collaborator"]["list"][number];
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { generateDeliveryPdf } from "~/lib/pdf";

type CartItem = {
  id: string;
  itemType: "EPI" | "UNIFORM";
  itemName: string;
  size: string;
  quantity: number;
  reasonId: string;
  reasonName: string;
  notes: string;
};

export default function NewDeliveryPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCollaborator, setSelectedCollaborator] =
    useState<CollaboratorData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showUniforms, setShowUniforms] = useState<boolean | null>(null);
  const [signature, setSignature] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { data: searchResults } = api.collaborator.list.useQuery(
    { search: search || undefined },
    { enabled: search.length > 0 },
  );
  const { data: epis } = api.epi.list.useQuery();
  const { data: uniforms } = api.uniform.list.useQuery();
  const { data: reasons } = api.reason.list.useQuery();
  const createDelivery = api.delivery.create.useMutation();
  const uploadPdf = api.delivery.uploadPdf.useMutation();

  const [newItem, setNewItem] = useState<{
    itemType: "EPI" | "UNIFORM";
    itemId: string;
    itemName: string;
    size: string;
    quantity: number;
    reasonId: string;
    notes: string;
  }>({
    itemType: "EPI",
    itemId: "",
    itemName: "",
    size: "",
    quantity: 1,
    reasonId: "",
    notes: "",
  });

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      const x =
        "touches" in e
          ? e.touches[0]!.clientX - rect.left
          : e.clientX - rect.left;
      const y =
        "touches" in e
          ? e.touches[0]!.clientY - rect.top
          : e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [],
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>,
    ) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const x =
        "touches" in e
          ? e.touches[0]!.clientX - rect.left
          : e.clientX - rect.left;
      const y =
        "touches" in e
          ? e.touches[0]!.clientY - rect.top
          : e.clientY - rect.top;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
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

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };

  const addToCart = (forcedType?: "EPI" | "UNIFORM") => {
    const itemType = forcedType ?? newItem.itemType;
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
    setNewItem({
      itemType,
      itemId: "",
      itemName: "",
      size: "",
      quantity: 1,
      reasonId: "",
      notes: "",
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = async () => {
    if (!selectedCollaborator) return;
    if (!signature) {
      toast.error("Assinatura é obrigatória");
      return;
    }
    setSubmitting(true);
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
      });

      const reasonsMap = Object.fromEntries(
        (reasons ?? []).map((r) => [r.id, r.name]),
      );

      const dateStr = new Intl.DateTimeFormat("pt-BR").format(new Date());

      const pdf = generateDeliveryPdf({
        collaboratorName: selectedCollaborator.name,
        collaboratorRegistration: selectedCollaborator.registration,
        manager: selectedCollaborator.manager,
        operation: selectedCollaborator.operation.name,
        date: dateStr,
        signature,
        items: cart.map((item) => ({
          itemType: item.itemType,
          itemName: item.itemName,
          size: item.size,
          quantity: item.quantity,
          reason: item.reasonName || (reasonsMap[item.reasonId] ?? ""),
          notes: item.notes,
        })),
      });

      const pdfBase64 = pdf.output("datauristring");

      const pdfFileName = `ficha-${new Date().toISOString().split("T")[0]}.pdf`;
      await uploadPdf.mutateAsync({
        deliveryId: delivery.id,
        pdfBase64,
        fileName: pdfFileName,
      });

      toast.success("Entrega registrada com sucesso!");
      router.push("/dashboard/historico");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar entrega");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = showUniforms === null ? 3 : showUniforms ? 4 : 3;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nova Entrega
        </h2>
        <p className="text-sm text-gray-500">
          Registro de entrega de EPIs e Uniformes
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4].slice(0, totalSteps).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step === s
                  ? "bg-blue-600 text-white"
                  : step > s
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={`hidden sm:inline ${step === s ? "font-medium text-blue-600" : "text-gray-500"}`}
            >
              {s === 1
                ? "Colaborador"
                : s === 2
                  ? "EPIs"
                  : s === 3
                    ? "Uniformes"
                    : "Assinatura"}
            </span>
            {s < totalSteps && <div className="h-px w-8 bg-gray-300" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Colaborador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Pesquisar por nome ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {searchResults &&
              searchResults.length > 0 &&
              !selectedCollaborator && (
                <div className="max-h-60 divide-y divide-gray-200 overflow-auto rounded-lg border dark:divide-gray-700 dark:border-gray-700">
                  {searchResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() =>
                        setSelectedCollaborator(c)
                      }
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {c.registration}
                        </p>
                      </div>
                      <Badge>{c.operation.name}</Badge>
                    </button>
                  ))}
                </div>
              )}
            {selectedCollaborator && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nome</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedCollaborator.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Matrícula</p>
                    <p className="font-mono font-medium text-gray-900 dark:text-white">
                      {selectedCollaborator.registration}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Gestor</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCollaborator.manager}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Operação</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCollaborator.operation.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setSelectedCollaborator(null)}
                >
                  Trocar colaborador
                </Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                disabled={!selectedCollaborator}
                onClick={() => setStep(2)}
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>EPIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                id="epiItem"
                label="EPI"
                placeholder="Selecione..."
                value={newItem.itemId}
                options={
                  epis?.map((e) => ({ value: e.id, label: e.name })) ?? []
                }
                onChange={(e) => {
                  const epi = epis?.find((ep) => ep.id === e.target.value);
                  setNewItem({
                    ...newItem,
                    itemId: e.target.value,
                    itemName: epi?.name ?? "",
                    size: epi?.size ?? "",
                  });
                }}
              />
              <Input
                label="Tamanho"
                value={newItem.size}
                onChange={(e) =>
                  setNewItem({ ...newItem, size: e.target.value })
                }
              />
              <Input
                label="Quantidade"
                type="number"
                min={1}
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: Number(e.target.value) })
                }
              />
              <Select
                id="epiReason"
                label="Motivo"
                placeholder="Selecione..."
                value={newItem.reasonId}
                options={
                  reasons?.map((r) => ({ value: r.id, label: r.name })) ?? []
                }
                onChange={(e) =>
                  setNewItem({ ...newItem, reasonId: e.target.value })
                }
              />
              <Input
                label="Observações"
                value={newItem.notes}
                onChange={(e) =>
                  setNewItem({ ...newItem, notes: e.target.value })
                }
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCart("EPI")}
            >
              <Plus className="h-4 w-4" /> Adicionar EPI
            </Button>

            {cart.filter((i) => i.itemType === "EPI").length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">EPIs selecionados:</p>
                {cart
                  .filter((i) => i.itemType === "EPI")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <span className="font-medium">
                        {item.itemName} {item.size && `(${item.size})`} x
                        {item.quantity}
                      </span>
                      <span className="text-gray-500">{item.reasonName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={() => {
                  setShowUniforms(null);
                  setStep(3);
                }}
              >
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && showUniforms === null && (
        <Card>
          <CardHeader>
            <CardTitle>Deseja entregar Uniformes?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={() => {
                  setShowUniforms(true);
                }}
              >
                Sim
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setShowUniforms(false);
                  setStep(4);
                }}
              >
                Não
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && showUniforms && (
        <Card>
          <CardHeader>
            <CardTitle>Uniformes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                id="uniformItem"
                label="Uniforme"
                placeholder="Selecione..."
                options={
                  uniforms?.map((u) => ({ value: u.id, label: u.name })) ?? []
                }
                onChange={(e) => {
                  const uni = uniforms?.find((u) => u.id === e.target.value);
                  setNewItem({
                    ...newItem,
                    itemType: "UNIFORM",
                    itemId: e.target.value,
                    itemName: uni?.name ?? "",
                    size: "",
                  });
                }}
              />
              <Input
                label="Tamanho"
                value={newItem.size}
                onChange={(e) =>
                  setNewItem({ ...newItem, size: e.target.value })
                }
              />
              <Input
                label="Quantidade"
                type="number"
                min={1}
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: Number(e.target.value) })
                }
              />
              <Select
                id="uniformReason"
                label="Motivo"
                placeholder="Selecione..."
                options={
                  reasons?.map((r) => ({ value: r.id, label: r.name })) ?? []
                }
                onChange={(e) =>
                  setNewItem({ ...newItem, reasonId: e.target.value })
                }
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addToCart("UNIFORM")}
            >
              <Plus className="h-4 w-4" /> Adicionar Uniforme
            </Button>

            {cart.filter((i) => i.itemType === "UNIFORM").length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uniformes selecionados:</p>
                {cart
                  .filter((i) => i.itemType === "UNIFORM")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <span className="font-medium">
                        {item.itemName} {item.size && `(${item.size})`} x
                        {item.quantity}
                      </span>
                      <span className="text-gray-500">{item.reasonName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUniforms(null);
                }}
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(4)}>
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Termo de Responsabilidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <p className="mb-2 font-semibold">TERMO DE RESPONSABILIDADE</p>
              <p>
                Eu, <strong>{selectedCollaborator?.name}</strong>, matrícula{" "}
                <strong>{selectedCollaborator?.registration}</strong>, declaro
                ter recebido os Equipamentos de Proteção Individual e/ou
                Uniformes descritos abaixo, comprometendo-me a utilizá-los
                corretamente conforme as orientações recebidas, mantendo-os em
                bom estado de conservação e comunicando imediatamente qualquer
                avaria ou necessidade de substituição.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 font-semibold">Itens desta entrega:</p>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>
                    {item.itemName} {item.size && `(${item.size})`} x
                    {item.quantity}
                  </span>
                  <span className="text-gray-500">
                    {item.itemType === "EPI" ? "EPI" : "Uniforme"}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">
                Assinatura do Colaborador *
              </p>
              <div className="rounded-lg border dark:border-gray-700">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="h-48 w-full cursor-crosshair touch-none rounded-lg bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              {signature && (
                <p className="mt-1 text-xs text-green-600">
                  Assinatura registrada
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={clearSignature}
              >
                Limpar assinatura
              </Button>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(showUniforms ? 3 : 2)}
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!signature || cart.length === 0}
                loading={submitting}
              >
                Finalizar Entrega
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
