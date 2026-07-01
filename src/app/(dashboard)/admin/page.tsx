import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Briefcase, Users } from "lucide-react";

const adminModules = [
  {
    href: "/admin/operacoes",
    title: "Operações",
    description: "Gerenciar operações vinculadas a cidades",
    icon: Briefcase,
  },
  {
    href: "/admin/usuarios",
    title: "Usuários",
    description: "Gerenciar usuários do sistema",
    icon: Users,
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Administração
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerencie usuários e operações do sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-colors hover:border-blue-500 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-base">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{module.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
