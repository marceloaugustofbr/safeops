import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "SafeOps - Gestão de EPIs e Uniformes",
  description: "Sistema de gestão de entrega de EPIs e uniformes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const dark = localStorage.getItem("theme") === "dark" ||
                  (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
                if (dark) document.documentElement.classList.add("dark");
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!bg-white !border !border-gray-300 !text-gray-900 !text-sm !shadow-lg dark:!bg-gray-800 dark:!border-gray-700 dark:!text-gray-100",
          }}
          closeButton
          duration={3000}
        />
      </body>
    </html>
  );
}
