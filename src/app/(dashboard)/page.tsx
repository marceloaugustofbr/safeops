import { redirect } from "next/navigation";
import { Users, ClipboardCheck, Package, HardHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/server/db";
import { getSession } from "~/server/better-auth/server";

async function getDashboardData(locationId?: string) {
  const where = locationId ? { locationId } : {};

  const [totalCollaborators, totalDeliveries, recentDeliveries] =
    await Promise.all([
      db.collaborator.count({ where: { ...where, status: "ACTIVE" } }),
      db.delivery.count({ where }),
      db.delivery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { collaborator: true, user: true },
      }),
    ]);

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const deliveriesThisMonth = await db.delivery.count({
    where: { ...where, createdAt: { gte: currentMonth } },
  });

  return {
    totalCollaborators,
    totalDeliveries,
    deliveriesThisMonth,
    recentDeliveries,
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const userLocationId = session.user.locationId ?? undefined;
  const isAdmin = false;

  const data = await getDashboardData(isAdmin ? undefined : userLocationId);

  const stats = [
    {
      title: "Colaboradores Ativos",
      value: data.totalCollaborators,
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/50",
    },
    {
      title: "Total de Entregas",
      value: data.totalDeliveries,
      icon: Package,
      color: "text-green-600 bg-green-100 dark:bg-green-900/50",
    },
    {
      title: "Entregas no Mês",
      value: data.deliveriesThisMonth,
      icon: ClipboardCheck,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/50",
    },
    {
      title: "SafeOps",
      value: "Ativo",
      icon: HardHat,
      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Entregas</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {data.recentDeliveries.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Nenhuma entrega registrada ainda.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {delivery.collaborator.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {delivery.collaborator.registration}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {new Intl.DateTimeFormat("pt-BR").format(delivery.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
