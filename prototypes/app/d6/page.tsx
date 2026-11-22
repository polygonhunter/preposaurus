import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { CockpitApp } from "@/components/d6/CockpitApp";
import { InlineScript } from "@/components/d6/theme/InlineScript";
import { ROOT_ID, THEME_BOOT_SCRIPT } from "@/components/d6/theme/theme";
import { getDashboardData } from "@/lib/dashboard-data";
import "./theme.css";

const sans = Inter({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600"], variable: "--d6-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--d6-mono" });

export const metadata: Metadata = {
  title: "Preposaurus · Glas-Cockpit",
  description: "Design 6: Bento-Glas mit Instrumenten, hell und dunkel",
};

export default function GlassCockpitPage() {
  return (
    <div
      id={ROOT_ID}
      suppressHydrationWarning
      className={`d6-root ${sans.variable} ${mono.variable} font-(family-name:--d6-sans)`}
    >
      {/* Setzt das Farbschema vor dem ersten Paint (gespeicherte Wahl, sonst System). */}
      <InlineScript html={THEME_BOOT_SCRIPT} />
      <CockpitApp data={getDashboardData()} />
    </div>
  );
}
