import { ChevronRight } from "lucide-react";
import type { ElementType } from "react";

interface SelectionCardProps {
  title: string;
  description: string;
  icon: ElementType;
  onSelect: () => void;
}

export function SelectionCard({ title, description, icon: Icon, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-5 rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:group-hover:bg-blue-900">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1">
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-500" />
    </button>
  );
}