import { CalendarDays, Home, ScrollText, Trophy, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";

export default function BottomNav(_legacyProps?: { slug?: string; active?: string }) {
  const { t } = useLanguage();
  const navItems = [
    {
      label: t("companion.nav.home"),
      to: "/",
      icon: Home,
      end: true
    },
    {
      label: t("companion.nav.battles"),
      to: "/battles",
      icon: ScrollText
    },
    {
      label: t("companion.nav.events"),
      to: "/host",
      icon: CalendarDays
    },
    {
      label: t("companion.nav.players"),
      to: "/players",
      icon: Users
    },
    {
      label: t("companion.nav.community"),
      to: "/community",
      icon: Trophy
    }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            className={({ isActive }) => (isActive ? "active" : "")}
            end={item.end}
            key={item.to}
            to={item.to}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
