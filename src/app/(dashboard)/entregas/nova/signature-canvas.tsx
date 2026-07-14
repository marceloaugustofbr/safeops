import type { RefObject } from "react";
import { Check } from "lucide-react";
import { Button } from "~/components/ui/button";

interface SignatureCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  signature: string;
  onClear: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  onTouchEnd: () => void;
}

export function SignatureCanvas({
  canvasRef,
  signature,
  onClear,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: SignatureCanvasProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Assinatura do Colaborador <span className="text-red-500">*</span>
      </p>
      <div className="overflow-hidden rounded-xl border-2 border-dashed border-gray-300 transition-colors hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="h-48 w-full cursor-crosshair touch-none bg-white sm:h-52"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        {signature ? (
          <p className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Assinatura registrada
          </p>
        ) : (
          <p className="text-sm text-gray-400">Desenhe sua assinatura no campo acima</p>
        )}
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar
        </Button>
      </div>
    </div>
  );
}