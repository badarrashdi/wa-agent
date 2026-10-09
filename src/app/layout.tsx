import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp AI Agent - Smart Customer & Clinic Automation",
  description: "NextGen WhatsApp AI Agent with tool calling, appointments, and live dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#0c0c0e] text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
