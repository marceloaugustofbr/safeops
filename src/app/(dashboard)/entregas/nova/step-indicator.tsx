import { Check, User, HardHat, Shirt, PenLine } from "lucide-react";

const STEP_ICONS = {
  Colaborador: <User className="h-3.5 w-3.5" />,
  EPIs: <HardHat className="h-3.5 w-3.5" />,
  Uniformes: <Shirt className="h-3.5 w-3.5" />,
  Assinatura: <PenLine className="h-3.5 w-3.5" />,
} as const;

type StepName = keyof typeof STEP_ICONS;

interface StepIndicatorProps {
  current: number;
  hasEpi: boolean;
  hasUniform: boolean;
}

export function StepIndicator({ current, hasEpi, hasUniform }: StepIndicatorProps) {
  const visible: { step: number; name: StepName }[] = [
    { step: 1, name: "Colaborador" },
  ];

  if (hasEpi) {
    visible.push({ step: 2, name: "EPIs" });
  }
  if (hasUniform) {
    visible.push({ step: hasEpi ? 3 : 2, name: "Uniformes" });
  }

  const lastStep = visible.length + 1;
  visible.push({ step: lastStep, name: "Assinatura" });

  const stepMap: Record<number, number> = {};
  visible.forEach((v, i) => {
    stepMap[v.step] = i + 1;
  });
  const displayStep = stepMap[current] ?? 1;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {visible.map((v, i) => {
        const idx = i + 1;
        const done = idx < displayStep;
        const active = idx === displayStep;
        const icon = STEP_ICONS[v.name];

        return (
          <div key={v.step} className="flex items-center gap-1 sm:gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-8 sm:w-8 ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-blue-600 text-white ring-2 ring-blue-200 ring-offset-2"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : icon}
            </div>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                active ? "text-blue-600" : done ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              {v.name}
            </span>
            {i < visible.length - 1 && (
              <div
                className={`mx-1 h-px w-6 sm:w-10 ${
                  done ? "bg-emerald-300" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}