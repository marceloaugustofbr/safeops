"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  MoreVertical,
  Building2,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardTitle, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const OPERATION_TYPES = ["Service Center", "Crossdocking", "Full"];

function KebabMenu({
  onAddOperation,
  onDeleteCity,
}: {
  onAddOperation: () => void;
  onDeleteCity: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => {
              setOpen(false);
              onAddOperation();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar Operação
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDeleteCity();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Cidade
          </button>
        </div>
      )}
    </div>
  );
}

function AddOperationDialog({
  locationId,
  locationLabel,
  onClose,
}: {
  locationId: string;
  locationLabel: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const { data: operations } = api.operation.list.useQuery();
  const utils = api.useUtils();
  const createMany = api.operation.createMany.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count} operação(ões) adicionada(s)`);
      void utils.operation.list.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const existingNames =
    operations
      ?.filter((o) => o.locationId === locationId)
      .map((o) => o.name) ?? [];

  const availableTypes = OPERATION_TYPES.filter(
    (t) => !existingNames.includes(t),
  );

  const toggle = (type: string) =>
    setSelected((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );

  const allNames = [
    ...selected,
    ...(customName.trim() ? [customName.trim()] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Adicionar Operação
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cidade
            </p>
            <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
              {locationLabel}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Operações disponíveis
            </p>
            {availableTypes.length === 0 ? (
              <p className="text-sm text-gray-400">Todas as operações já foram adicionadas</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTypes.map((type) => {
                  const isSelected = selected.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggle(type)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome personalizado"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1"
              />
              {customName.trim() && (
                <button
                  type="button"
                  onClick={() => setCustomName("")}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <p className="text-xs text-gray-400">
            {allNames.length} operação(ões) selecionada(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMany.mutate({ names: allNames, locationId })}
              disabled={allNames.length === 0 || createMany.isPending}
              loading={createMany.isPending}
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OperationAdminPage() {
  const [showNewCity, setShowNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityOps, setNewCityOps] = useState<string[]>([]);
  const [addOpTarget, setAddOpTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [deleteOpConfirm, setDeleteOpConfirm] = useState<string | null>(null);

  const { data: operations, isLoading: opsLoading } =
    api.operation.list.useQuery();
  const { data: locations } = api.location.list.useQuery();
  const utils = api.useUtils();

  const del = api.operation.delete.useMutation({
    onSuccess: () => {
      toast.success("Operação removida");
      void utils.operation.list.invalidate();
      setDeleteOpConfirm(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const createCity = api.location.create.useMutation({
    onSuccess: () => {
      toast.success("Cidade cadastrada");
      void utils.location.list.invalidate();
      setShowNewCity(false);
      setNewCityName("");
      setNewCityOps([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCity = api.location.delete.useMutation({
    onSuccess: () => {
      toast.success("Cidade excluída");
      void utils.location.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const opsByLocation = new Map<string, typeof operations>();
  if (operations) {
    for (const op of operations) {
      const locId = op.locationId ?? "sem-cidade";
      if (!opsByLocation.has(locId)) opsByLocation.set(locId, []);
      opsByLocation.get(locId)!.push(op);
    }
  }

  if (opsLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-6">
      {addOpTarget && (
        <AddOperationDialog
          locationId={addOpTarget.id}
          locationLabel={addOpTarget.label}
          onClose={() => setAddOpTarget(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Excluir Cidade
            </h3>
            <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir
            </p>
            <p className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
              {deleteConfirm.label}?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteCity.mutate(deleteConfirm.id)}
                loading={deleteCity.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteOpConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Excluir Operação
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir esta operação?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteOpConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => del.mutate(deleteOpConfirm)}
                loading={del.isPending}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Gestão
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Operações Mercado Livre
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vincule os tipos de operação disponíveis para cada cidade
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1" />
        <Button onClick={() => setShowNewCity(!showNewCity)}>
          <Building2 className="h-4 w-4" />{" "}
          {showNewCity ? "Cancelar" : "Nova Cidade"}
        </Button>
      </div>

      {showNewCity && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h4 className="mb-4 text-sm font-semibold text-blue-700 dark:text-blue-300">
              Cadastrar Nova Cidade
            </h4>
            <div className="flex flex-wrap items-end gap-3">
              <Input
                label="Cidade"
                placeholder="ex: Avaré"
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="min-w-[200px] flex-1"
                autoFocus
              />
              <Button
                onClick={() =>
                  createCity.mutate({
                    name: "Mercado Livre",
                    city: newCityName,
                    unit: `MLB ${newCityName}`,
                    operationNames: newCityOps,
                  })
                }
                disabled={!newCityName || createCity.isPending}
                loading={createCity.isPending}
              >
                <Plus className="h-4 w-4" /> Cadastrar
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Operações:</span>
              {OPERATION_TYPES.map((type) => {
                const selected = newCityOps.includes(type);
                return (
                  <label
                    key={type}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selected}
                      onChange={() =>
                        setNewCityOps((prev) =>
                          prev.includes(type)
                            ? prev.filter((t) => t !== type)
                            : [...prev, type],
                        )
                      }
                    />
                    {type}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Nome exibido: &quot;Mercado Livre - {newCityName || "cidade"}&quot;
              {newCityOps.length > 0 &&
                ` · ${newCityOps.length} operação(ões) selecionada(s)`}
            </p>
          </CardContent>
        </Card>
      )}

      {(!locations || locations.length === 0) && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhuma cidade cadastrada. Clique em &quot;Nova Cidade&quot; para começar.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {locations?.map((loc) => {
          const cityOps = opsByLocation.get(loc.id) ?? [];
          const label = `${loc.name} - ${loc.city}`;
          return (
            <Card key={loc.id}>
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                <CardTitle className="text-base font-semibold">
                  {label}
                </CardTitle>
                <KebabMenu
                  onAddOperation={() =>
                    setAddOpTarget({ id: loc.id, label })
                  }
                  onDeleteCity={() =>
                    setDeleteConfirm({ id: loc.id, label })
                  }
                />
              </div>
              <CardContent className="px-6 py-4">
                {cityOps.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Nenhuma operação cadastrada
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {cityOps.map((op) => (
                      <Badge
                        key={op.id}
                        variant="info"
                        className="flex items-center gap-2 px-3 py-1.5 text-sm"
                      >
                        {op.name}
                        <button
                          onClick={() => setDeleteOpConfirm(op.id)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-red-200 dark:hover:bg-red-800"
                          title="Remover operação"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
