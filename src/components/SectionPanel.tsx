import { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  meta: string;
  children: ReactNode;
};

export default function SectionPanel({
  title,
  meta,
  children
}: SectionPanelProps) {
  return (
    <section className="section-panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{meta}</span>
      </div>
      <div className="achievement-list">{children}</div>
    </section>
  );
}
