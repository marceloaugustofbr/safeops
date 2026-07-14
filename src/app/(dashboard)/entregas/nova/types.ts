import type { RouterOutputs } from "~/trpc/react";

export type CollaboratorData = RouterOutputs["collaborator"]["search"][number];

export type EpiData = RouterOutputs["epi"]["list"][number];
export type UniformData = RouterOutputs["uniform"]["list"][number];
export type ReasonData = RouterOutputs["reason"]["list"][number];

export type CartItem = {
  id: string;
  itemType: "EPI" | "UNIFORM";
  itemName: string;
  size: string;
  quantity: number;
  reasonId: string;
  reasonName: string;
  notes: string;
};

export type NewItemForm = {
  itemType: "EPI" | "UNIFORM";
  itemId: string;
  itemName: string;
  size: string;
  quantity: number;
  reasonId: string;
  notes: string;
};

const EPI_SIZE_RULES: [keywords: string[], sizes: string[]][] = [
  [
    ["luva", "soft540", "luva de proteção"],
    ["P", "M", "G", "GG"],
  ],
  [
    ["colete", "colete refletivo", "colete sinalizador"],
    ["P", "M", "G", "GG", "XG", "EGG", "EXG"],
  ],
  [
    ["bota", "botina", "bota de proteção", "metatarso"],
    ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"],
  ],
  [
    ["casquete"],
    ["Único"],
  ],
  [
    ["capacete", "capacete de proteção"],
    ["Único"],
  ],
  [
    ["óculos", "oculos", "óculos escuro", "oculos escuro"],
    ["Único"],
  ],
  [
    ["protetor solar", "fps60", "fps 60"],
    ["Único"],
  ],
  [
    ["protetor auricular", "abafador", "plug"],
    ["P", "M", "G"],
  ],
  [
    ["respirador", "máscara", "semifacial", "ffp"],
    ["P", "M", "G"],
  ],
];

export function getEpiSizes(name: string): string[] | null {
  const lower = name.toLowerCase();
  for (const [keywords, sizes] of EPI_SIZE_RULES) {
    if (keywords.some((k) => lower.includes(k))) return sizes;
  }
  return null;
}

export const ITEM_TYPE_CONFIG = {
  EPI: {
    label: "EPI",
    gradient: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    badge: "info" as const,
    border: "border-l-blue-500",
  },
  UNIFORM: {
    label: "Uniforme",
    gradient: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    badge: "success" as const,
    border: "border-l-emerald-500",
  },
} as const;