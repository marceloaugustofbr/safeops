"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collaboratorSchema,
  type CollaboratorInput,
} from "~/lib/validations/schemas";

function CollaboratorForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CollaboratorInput>({
    resolver: zodResolver(collaboratorSchema),
  });

  const { data: operations } = api.operation.list.useQuery();
  const utils = api.useUtils();
  const create = api.collaborator.create.useMutation({
    onSuccess: () => {
      toast.success("Colaborador cadastrado");
      void utils.collaborator.list.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={handleSubmit((data) => create.mutate(data))}
      className="space-y-4"
    >
      <Input
        id="registration"
        label="Matrícula"
        {...register("registration")}
        error={errors.registration?.message}
      />
      <Input
        id="name"
        label="Nome"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        id="manager"
        label="Gestor Direto"
        {...register("manager")}
        error={errors.manager?.message}
      />
      <Select
        id="operationId"
        label="Operação"
        placeholder="Selecione..."
        options={operations?.map((o) => ({ value: o.id, label: o.name })) ?? []}
        {...register("operationId")}
        onChange={(e) => setValue("operationId", e.target.value)}
      />
      <Input
        id="admissionDate"
        label="Data de Admissão"
        type="date"
        {...register("admissionDate")}
        error={errors.admissionDate?.message}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending}>
          Cadastrar
        </Button>
      </div>
    </form>
  );
}

export default function CollaboratorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { data: collaborators, isLoading } = api.collaborator.list.useQuery({
    search: search || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Colaboradores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cadastro de colaboradores da unidade
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo Colaborador
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <CollaboratorForm
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Pesquisar por nome ou matrícula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent padding="none">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Gestor</TableHead>
                  <TableHead>Operação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-sm">
                      {c.registration}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.manager}</TableCell>
                    <TableCell>{c.operation.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.status === "ACTIVE" ? "success" : "danger"}
                      >
                        {c.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Ver histórico">
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {collaborators?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500"
                    >
                      Nenhum colaborador encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
