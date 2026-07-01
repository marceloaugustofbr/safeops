import { redirect } from "next/navigation";
import { Sidebar } from "~/components/layout/sidebar";
import { Header } from "~/components/layout/header";
import { getSession } from "~/server/better-auth/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={session.user.role ?? "USER"} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          userName={session.user.name ?? "Usuário"}
          userRole={session.user.role ?? "USER"}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
