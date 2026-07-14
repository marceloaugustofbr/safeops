import { useMemo } from "react";
import { Plus } from "lucide-react";
import { HardHat, Shirt, Package } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { ItemTable, ItemTableEmpty } from "./item-table";
import type { CartItem, EpiData, UniformData, ReasonData, NewItemForm } from "./types";
import { ITEM_TYPE_CONFIG, getEpiSizes } from "./types";

const TYPE_ICONS = { EPI: HardHat, UNIFORM: Shirt };

interface ItemFormProps {
  type: "EPI" | "UNIFORM";
  items: EpiData[] | UniformData[] | undefined;
  reasons: ReasonData[] | undefined;
  cartItems: CartItem[];
  newItem: NewItemForm;
  isLoading: boolean;
  onNewItemChange: (updates: Partial<NewItemForm>) => void;
  onAddToCart: (type: "EPI" | "UNIFORM") => void;
  onRemoveFromCart: (id: string) => void;
}

export function ItemForm({
  type,
  items,
  reasons,
  cartItems,
  newItem,
  isLoading,
  onNewItemChange,
  onAddToCart,
  onRemoveFromCart,
}: ItemFormProps) {
  const config = ITEM_TYPE_CONFIG[type];
  const Icon = TYPE_ICONS[type];

  const isLoadingItems = isLoading || items === undefined;
  const isEmpty = items?.length === 0 && !isLoading;

  const predefinedSizes = useMemo(() => {
    if (type !== "EPI" || !newItem.itemName) return null;
    return getEpiSizes(newItem.itemName);
  }, [type, newItem.itemName]);

  const hasSizeSelect = predefinedSizes !== null;
  const isUniqueSize = hasSizeSelect && predefinedSizes.length === 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Adicionar {config.label}</h3>
          <p className="text-sm text-gray-500">Preencha os dados do {config.label} e clique em adicionar</p>
        </div>
      </div>

      {isLoadingItems ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          {type === "EPI" && (
            <div className="w-36 space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}
          <div className="w-24 space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      ) : isEmpty ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center dark:border-gray-600">
          <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-500" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            Nenhum {config.label} cadastrado
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Cadastre os {config.label}s em <strong>Admin → Operações</strong>
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="min-w-0 flex-[2]">
            <Select
              id={`${type}-item`}
              label={config.label}
              placeholder="Selecione..."
              value={newItem.itemId}
              options={items?.map((i) => ({ value: i.id, label: i.name })) ?? []}
              onChange={(e) => {
                const item = items?.find((i) => i.id === e.target.value);
                const sizes = item && type === "EPI" ? getEpiSizes(item.name) : null;
                const autoSize =
                  sizes !== null && sizes.length === 1
                    ? sizes[0]
                    : "";
                onNewItemChange({
                  itemType: type,
                  itemId: e.target.value,
                  itemName: item?.name ?? "",
                  size: autoSize,
                });
              }}
            />
          </div>
          {type === "EPI" && (
            <div className={isUniqueSize ? "w-auto opacity-60" : "w-36"}>
              {hasSizeSelect ? (
                <Select
                  id={`${type}-size`}
                  label="Tamanho"
                  value={newItem.size}
                  options={predefinedSizes.map((s) => ({ value: s, label: s }))}
                  onChange={(e) => onNewItemChange({ size: e.target.value })}
                  disabled={isUniqueSize}
                />
              ) : (
                <Input
                  label="Tamanho"
                  placeholder="Digite o tamanho"
                  value={newItem.size}
                  onChange={(e) => onNewItemChange({ size: e.target.value })}
                />
              )}
            </div>
          )}
          <div className="w-20">
            <Input
              label="Qtd"
              type="number"
              min={1}
              value={newItem.quantity}
              onChange={(e) => onNewItemChange({ quantity: Number(e.target.value) })}
            />
          </div>
          <div className="min-w-0 flex-[1.5]">
            <Select
              id={`${type}-reason`}
              label="Motivo"
              placeholder="Selecione..."
              value={newItem.reasonId}
              options={reasons?.map((r) => ({ value: r.id, label: r.name })) ?? []}
              onChange={(e) => onNewItemChange({ reasonId: e.target.value })}
            />
          </div>
          <div className="min-w-0 flex-[1.5]">
            <Input
              label="Observações"
              placeholder="Opcional"
              value={newItem.notes}
              onChange={(e) => onNewItemChange({ notes: e.target.value })}
            />
          </div>
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => onAddToCart(type)}
          >
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>
      )}

      {cartItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {config.label}s selecionados ({cartItems.length})
          </p>
          <ItemTable items={cartItems} onRemove={onRemoveFromCart} />
        </div>
      ) : !isLoadingItems && !isEmpty && (
        <ItemTableEmpty label={config.label} />
      )}
    </div>
  );
}