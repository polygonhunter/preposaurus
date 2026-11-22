import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import { PlayfulApp } from "@/components/d5/PlayfulApp";
import { getDashboardData } from "@/lib/dashboard-data";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-d5-body" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-d5-display" });

export const metadata: Metadata = {
  title: "Preposaurus · Verspielt",
  description: "Design 5: bunt, gamifiziert, mit sich füllenden Vorratsgläsern",
};

export default function PlayfulPage() {
  const data = getDashboardData();
  return <PlayfulApp data={data} fontClassName={`${nunito.variable} ${baloo.variable}`} />;
}
