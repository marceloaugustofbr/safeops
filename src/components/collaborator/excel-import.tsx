"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface ExcelRow {
  Matrícula: string;
  Nome: string;
  Cargo?: string;
  "Gestor Direto": string;
  Operação: string;
  "Data de Admissão": string;
}

export function ExcelImport({ onSuccess }: { onSuccess: () => void }) {
  const [rows, setRows] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();
  const createMany = api.collaborator.createMany.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created.length} colaborador(es) cadastrados`);
      if (data.skipped.length > 0) {
        toast.info(`${data.skipped.length} ignorados (já existem)`);
      }
      if (data.errors.length > 0) {
        toast.error(`${data.errors.length} erro(s)`);
      }
      void utils.collaborator.list.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleFile(file: File) {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. O limite é 5MB");
      return;
    }

    setFileName(file.name);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        toast.error("O arquivo não contém nenhuma planilha");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        toast.error("Não foi possível ler a planilha");
        return;
      }
      const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

      if (raw.length > 1000) {
        toast.error(`O arquivo contém ${raw.length} registros. O limite é 1000`);
        return;
      }

      function normalize(s: string) {
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      }

      const headers = Object.keys(raw[0] ?? {});
      const headerMap: Record<string, string> = {};
      for (const h of headers) {
        headerMap[normalize(h)] = h;
      }

      const expected = ["matricula", "nome", "gestor direto", "operacao", "data de admissao"];
      const missing = expected.filter((k) => !headerMap[k]);

      if (missing.length > 0) {
        toast.error(
          `Cabeçalhos não encontrados: ${missing.join(", ")}. Cabeçalhos encontrados: ${headers.join(", ") || "(vazios)"}`,
        );
        return;
      }

      const getField = (row: Record<string, string>, key: string) =>
        headerMap[key] ? row[headerMap[key]!] : undefined;

      const mapped = raw.map((r) => ({
        Matrícula: getField(r, "matricula") ?? "",
        Nome: getField(r, "nome") ?? "",
        Cargo: getField(r, "cargo"),
        "Gestor Direto": getField(r, "gestor direto") ?? "",
        Operação: getField(r, "operacao") ?? "",
        "Data de Admissão": getField(r, "data de admissao") ?? "",
      })) as ExcelRow[];

      const validRows = mapped.filter(
        (r) => r.Matrícula && r.Nome && r["Gestor Direto"] && r.Operação && r["Data de Admissão"],
      );

      if (validRows.length === 0) {
        toast.error("Nenhuma linha com dados válidos encontrada");
        return;
      }

      if (validRows.length < mapped.length) {
        toast.warning(`${mapped.length - validRows.length} linha(s) ignoradas por dados incompletos`);
      }

      const invalidDateRows = validRows.filter(
        (r) => !/^\d{4}-\d{2}-\d{2}$/.test(r["Data de Admissão"]) || isNaN(Date.parse(r["Data de Admissão"])),
      );

      if (invalidDateRows.length > 0) {
        toast.error(`${invalidDateRows.length} registro(s) com data de admissão inválida (use YYYY-MM-DD): ${invalidDateRows.map((r) => r.Matrícula).join(", ")}`);
        return;
      }

      setRows(validRows);
    } catch {
      toast.error("Erro ao ler o arquivo. Verifique se é um Excel válido (.xlsx ou .xls)");
    }
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Clique para selecionar um arquivo Excel
          </p>
          <p className="mt-1 text-xs text-gray-400">
            .xlsx ou .xls com as colunas: Matrícula, Nome, Gestor Direto, Operação, Data de Admissão (Cargo opcional)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">{fileName}</span>
            <span className="text-gray-300">·</span>
            <span>{rows.length} registro(s)</span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 font-medium text-gray-500">Matrícula</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Nome</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Cargo</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Operação</th>
                  <th className="px-3 py-2 font-medium text-gray-500">Admissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{row.Matrícula}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{row.Nome}</td>
                    <td className="px-3 py-2 text-gray-500">{row.Cargo ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.Operação}</td>
                    <td className="px-3 py-2 text-gray-500">{row["Data de Admissão"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRows([]);
                setFileName("");
              }}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Trocar arquivo
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              <Button
                size="sm"
                loading={createMany.isPending}
                onClick={() =>
                  createMany.mutate({
                    collaborators: rows.map((r) => ({
                      registration: r.Matrícula,
                      name: r.Nome,
                      role: r.Cargo || undefined,
                      manager: r["Gestor Direto"],
                      operationName: r.Operação,
                      admissionDate: r["Data de Admissão"],
                    })),
                  })
                }
              >
                Importar {rows.length} registro(s)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}