import Link from "next/link";
import { Briefcase, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";

const adminModules = [
  {
    href: "/admin/operacoes",
    title: "Operações",
    description: "Gerenciar operações vinculadas a cidades",
    icon: Briefcase,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    href: "/admin/usuarios",
    title: "Usuários",
    description: "Gerenciar usuários do sistema",
    icon: Users,
    gradient: "from-emerald-500 to-emerald-600",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestão
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie usuários e operações do sistema
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {adminModules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.href} href={module.href} className="group">
              <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 transition-opacity group-hover:opacity-5`}
                />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${module.gradient} shadow-sm`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
