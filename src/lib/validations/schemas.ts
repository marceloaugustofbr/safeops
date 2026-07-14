import { z } from "zod";

export const epiSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  ca: z.string().optional(),
  manufacturer: z.string().optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
});

export const uniformSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export const reasonSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["DELIVERY", "REMOVAL"]),
});

export const operationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  locationId: z.string().min(1, "Cidade é obrigatória"),
});

export const locationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
});

export const userSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "USER"]),
  locationId: z.string().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  locationId: z.string().nullable().optional(),
});

export const collaboratorSchema = z.object({
  registration: z.string().min(1, "Matrícula é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.string().optional(),
  manager: z.string().min(1, "Gestor é obrigatório"),
  operationId: z.string().min(1, "Operação é obrigatória"),
  admissionDate: z
    .string()
    .min(1, "Data de admissão é obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD")
    .refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  locationId: z.string().optional(),
});

export type EpiInput = z.infer<typeof epiSchema>;
export type UniformInput = z.infer<typeof uniformSchema>;
export type ReasonInput = z.infer<typeof reasonSchema>;
export type OperationInput = z.infer<typeof operationSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CollaboratorInput = z.infer<typeof collaboratorSchema>;
