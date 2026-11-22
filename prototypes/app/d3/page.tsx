import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GlassApp } from "@/components/d3/GlassApp";
import { getDashboardData } from "@/lib/dashboard-data";

const inter = Inter({ subsets: ["latin"], weight: ["200", "300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "Preposaurus · Glas & Bento",
  description: "Design 3: helle Glas-Kacheln im Bento-Raster",
};

export default function GlassBentoPage() {
  return (
    <div className={inter.className}>
      <GlassApp data={getDashboardData()} />
    </div>
  );
}
