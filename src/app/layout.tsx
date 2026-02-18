import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header/Header";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Barganito - As Melhores Promoções",
  description: "Encontre promoções incríveis e receba alertas personalizados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="container" style={{ marginTop: '2rem' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
