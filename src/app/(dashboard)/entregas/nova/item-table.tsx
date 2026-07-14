import { Trash2, HardHat, Shirt, Package } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import type { CartItem } from "./types";
import { ITEM_TYPE_CONFIG } from "./types";

const TYPE_ICONS = { EPI: HardHat, UNIFORM: Shirt };

interface ItemTableProps {
  items: CartItem[];
  onRemove?: (id: string) => void;
  readonly?: boolean;
}

export function ItemTable({ items, onRemove, readonly = false }: ItemTableProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
            <TableHead className="w-10 pl-4" />
            <TableHead>Item</TableHead>
            <TableHead className="w-24">Tamanho</TableHead>
            <TableHead className="w-20">Qtd</TableHead>
            <TableHead className="w-40">Motivo</TableHead>
            <TableHead>Observações</TableHead>
            {!readonly && <TableHead className="w-12 pr-4" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const config = ITEM_TYPE_CONFIG[item.itemType];
            const Icon = TYPE_ICONS[item.itemType];
            return (
              <TableRow key={item.id}>
                <TableCell className="pl-4">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.iconBg}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {item.itemName}
                </TableCell>
                <TableCell>
                  {item.size ? (
                    <Badge variant={config.badge}>{item.size}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-700 dark:text-gray-300">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {item.reasonName}
                </TableCell>
                <TableCell className="text-gray-500">
                  {item.notes || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </TableCell>
                {!readonly && (
                  <TableCell className="pr-4">
                    <button
                      type="button"
                      onClick={() => onRemove?.(item.id)}
                      className="rounded-md p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                      aria-label={`Remover ${item.itemName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function ItemTableEmpty({ label }: { label?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-gray-600">
      <Package className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-500" />
      <p className="mt-3 text-sm font-medium text-gray-500">
        {label ? `Nenhum ${label} adicionado` : "Nenhum item"}
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Use o formulário acima para adicionar itens
      </p>
    </div>
  );
}