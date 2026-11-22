import Link from "next/link";

const DESIGNS = [
  { href: "/d2", name: "2 · Kontrollzentrum", text: "Dunkel, Daten, leuchtende Anzeigen" },
  { href: "/d3", name: "3 · Glas & Bento", text: "Hell, ruhig, Kacheln mit Glas-Effekt" },
  { href: "/d5", name: "5 · Verspielt", text: "Bunt, Spiel-Elemente, Füllstände & Konfetti" },
  { href: "/d6", name: "6 · Glas-Cockpit (Mix 2 + 3)", text: "Bento-Glas mit Instrumenten, hell & dunkel" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Preposaurus · Design-Prototypen</h1>
      <p className="mt-3 text-zinc-400">Die Favoriten, gleiche Daten. Am besten in Handy-Breite ansehen.</p>
      <ul className="mt-10 grid gap-3">
        {DESIGNS.map((d) => (
          <li key={d.href}>
            <Link
              href={d.href}
              className="block rounded-2xl border border-zinc-800 p-5 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              <div className="text-lg font-medium">{d.name}</div>
              <div className="text-sm text-zinc-400">{d.text}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
