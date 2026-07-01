"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
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
import { userSchema, type UserInput } from "~/lib/validations/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function UserForm({
  initialData,
  onSuccess,
  onCancel,
}: {
  initialData?: UserInput & { id?: string };
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData ?? {
      name: "",
      email: "",
      password: "",
      role: "USER",
      locationId: "",
    },
  });

  const { data: locations } = api.location.list.useQuery();
  const utils = api.useUtils();
  const create = api.user.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário cadastrado");
      void utils.user.list.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const update = api.user.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado");
      void utils.user.list.invalidate();
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });
  const onSubmit = (data: UserInput) => {
    if (initialData?.id) {
      const { password, ...updateData } = data;
      void password;
      update.mutate({ id: initialData.id, data: updateData });
    } else {
      create.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="name"
        label="Nome"
        {...register("name")}
        error={errors.name?.message}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        {...register("email")}
        error={errors.email?.message}
      />
      {!initialData?.id && (
        <Input
          id="password"
          label="Senha"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
      )}
      <Select
        id="role"
        label="Perfil"
        options={[
          { value: "USER", label: "Usuário" },
          { value: "ADMIN", label: "Administrador" },
        ]}
        {...register("role")}
        onChange={(e) => setValue("role", e.target.value as "ADMIN" | "USER")}
      />
      <Select
        id="locationId"
        label="Localização"
        options={[
          { value: "", label: "Nenhuma" },
          ...(locations?.map((l) => ({
            value: l.id,
            label: `${l.name} - ${l.city}`,
          })) ?? []),
        ]}
        {...register("locationId")}
        onChange={(e) => setValue("locationId", e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending || update.isPending}>
          {initialData?.id ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}

export default function UserAdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<(UserInput & { id: string }) | null>(
    null,
  );
  const { data: users, isLoading } = api.user.list.useQuery();
  const del = api.user.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido");
      void utils.user.list.invalidate();
    },
  });
  const utils = api.useUtils();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Gestão
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Usuários
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie os usuários do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usuários</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setEditItem(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Novo Usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <UserForm
            initialData={editItem ?? undefined}
            onSuccess={() => {
              setShowForm(false);
              setEditItem(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditItem(null);
            }}
          />
        ) : isLoading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "info" : "default"}>
                      {u.role === "ADMIN" ? "Admin" : "Usuário"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.location
                      ? `${u.location.name} - ${u.location.city}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditItem({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            password: "",
                            role: u.role as UserInput["role"],
                            locationId: u.locationId ?? "",
                          });
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => del.mutate(u.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Nenhum usuário cadastrado
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
