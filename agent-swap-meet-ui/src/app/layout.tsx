// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "@/contexts/WalletContext";
import { Header } from "@/components/Header";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Footer } from "./agent/[id]/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agent Swap Meet",
  description: "A decentralized AI agent marketplace on Sei.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <div className="bg-gray-900 text-white min-h-screen">
            <Toaster // <-- ADD THE TOASTER COMPONENT
              position="top-center"
              reverseOrder={false}
              toastOptions={{
                style: {
                  background: '#333',
                  color: '#fff',
                },
              }}
            />
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}