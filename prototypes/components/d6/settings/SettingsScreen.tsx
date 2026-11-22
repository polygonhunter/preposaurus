"use client";

import { useRef } from "react";
import { findUser } from "@/lib/user-rules";
import type { Cockpit } from "../data/use-cockpit";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK } from "../motion/motion";
import type { ThemeState } from "../theme/use-theme";
import { SETTINGS_PAGES, canSee, isReadOnly, routeKey, type SettingsRoute } from "./routes";
import { SettingsPage } from "./SettingsPage";
import { SettingsContext } from "./state/context";
import type { SettingsNav } from "./state/use-settings-nav";
import type { SettingsState } from "./state/use-settings";
import { SettingsTopBar } from "./ui/SettingsTopBar";

interface SettingsScreenProps {
  nav: SettingsNav;
  cockpit: Cockpit;
  settings: SettingsState;
  theme: ThemeState;
  today: string;
}

/** Detailseiten tragen den Namen des Mitglieds bzw. Nutzers als Titel. */
function pageTitle(route: SettingsRoute, cockpit: Cockpit, settings: SettingsState): string {
  if (route.page === "mitglied") return cockpit.diet.members.find((m) => m.id === route.param)?.name ?? "Mitglied";
  if (route.page === "nutzer-detail") return findUser(settings.users, route.param ?? "")?.name ?? "Nutzer";
  return SETTINGS_PAGES[route.page].title;
}

/** Einstellungen als eigene Ansicht: Stapel-Navigation mit Zurück, Brotkrumen und Seitenwechsel per GSAP. */
export function SettingsScreen({ nav, cockpit, settings, theme, today }: SettingsScreenProps) {
  const stack = nav.stack ?? [{ page: "root" }];
  const route = stack[stack.length - 1];
  const key = routeKey(route);
  const { access } = SETTINGS_PAGES[route.page];
  const scope = useRef<HTMLDivElement>(null);
  const previous = useRef<{ key: string; depth: number } | null>(null);

  useGSAP(
    () => {
      const prev = previous.current;
      previous.current = { key, depth: stack.length };
      if (!prev || prev.key === key) return;
      const forward = stack.length >= prev.depth;
      window.scrollTo({ top: 0 });
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-settings-page]",
          { autoAlpha: 0, x: forward ? 32 : -32, filter: "blur(6px)" },
          { autoAlpha: 1, x: 0, filter: "blur(0px)", duration: 0.5, ease: "expo.out", clearProps: "transform,filter" },
        );
      });
    },
    { dependencies: [key], scope, revertOnUpdate: true },
  );

  const context = { cockpit, settings, nav, theme, today, readOnly: isReadOnly(access, settings.viewAs) };

  return (
    <div ref={scope}>
      <SettingsTopBar stack={stack} title={pageTitle(route, cockpit, settings)} onBack={nav.back} onCrumb={nav.goTo} />
      <SettingsContext value={context}>
        <div key={key} data-settings-page>
          {canSee(access, settings.viewAs) ? (
            <SettingsPage route={route} />
          ) : (
            <p className="px-1 text-sm text-(--d6-muted)">Dieser Bereich ist nur für Admins sichtbar.</p>
          )}
        </div>
      </SettingsContext>
    </div>
  );
}
