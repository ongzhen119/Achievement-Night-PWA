import { BookOpenCheck, CheckSquare, ScrollText, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";

type BottomNavProps = {
  slug: string;
  active: "checklist" | "guide" | "ranking" | "result";
};

export default function BottomNav({ slug, active }: BottomNavProps) {
  const { t } = useLanguage();
  const navItems = [
    {
      id: "checklist" as const,
      label: t("nav.checklist"),
      to: `/event/${slug}/checklist`,
      icon: CheckSquare
    },
    {
      id: "guide" as const,
      label: t("nav.quickStart"),
      to: `/event/${slug}/quick-start`,
      icon: BookOpenCheck
    },
    {
      id: "ranking" as const,
      label: t("nav.ranking"),
      to: `/event/${slug}/ranking`,
      icon: Trophy
    },
    {
      id: "result" as const,
      label: t("nav.result"),
      to: `/event/${slug}/result`,
      icon: ScrollText
    }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className={active === item.id ? "active" : ""}
            key={item.id}
            to={item.to}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
