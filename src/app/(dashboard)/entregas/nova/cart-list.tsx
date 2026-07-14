import { HardHat, Shirt, Package } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import type { CartItem } from "./types";
import { ITEM_TYPE_CONFIG } from "./types";

const TYPE_ICON_MAP: Record<"EPI" | "UNIFORM", typeof HardHat> = {
  EPI: HardHat,
  UNIFORM: Shirt,
};

interface CartListProps {
  items: CartItem[];
  compact?: boolean;
  onRemove?: (id: string) => void;
}

export function CartList({ items, compact = false }: CartListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-6 text-center dark:border-gray-600">
        <Package className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-500" />
        <p className="mt-2 text-sm text-gray-400">Nenhum item selecionado</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="divide-y divide-gray-100 rounded-xl border dark:divide-gray-700 dark:border-gray-700">
        {items.map((item) => {
          const config = ITEM_TYPE_CONFIG[item.itemType];
          const Icon = TYPE_ICON_MAP[item.itemType];
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                {item.itemName}
                {item.size && <span className="text-gray-500"> ({item.size})</span>}
                <span className="text-gray-500"> x{item.quantity}</span>
              </span>
              <Badge variant={config.badge}>{config.label}</Badge>
              <span className="text-sm text-gray-400">{item.reasonName}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens desta entrega:</p>
      <div className="divide-y divide-gray-100 rounded-xl border dark:divide-gray-700 dark:border-gray-700">
        {items.map((item) => {
          const config = ITEM_TYPE_CONFIG[item.itemType];
          const Icon = TYPE_ICON_MAP[item.itemType];
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                {item.itemName}
                {item.size && <span className="text-gray-500"> ({item.size})</span>}
                <span className="text-gray-500"> x{item.quantity}</span>
              </span>
              <Badge variant={config.badge}>{config.label}</Badge>
              <span className="text-sm text-gray-400">{item.reasonName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}