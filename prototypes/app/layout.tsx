import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Preposaurus – Design-Prototypen",
  description: "Fünf animierte UI-Entwürfe für die Vorrats-App",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
