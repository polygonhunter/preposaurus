import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ControlCenter } from "@/components/d2/ControlCenter";
import { getDashboardData } from "@/lib/dashboard-data";

const sans = Geist({ subsets: ["latin"], variable: "--d2-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--d2-mono" });

export const metadata: Metadata = {
  title: "Preposaurus · Kontrollzentrum",
  description: "Design 2: dunkles Instrumentenpanel für den Notvorrat",
};

export default function ControlCenterPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} font-(family-name:--d2-sans)`}>
      <ControlCenter data={getDashboardData()} />
    </div>
  );
}
