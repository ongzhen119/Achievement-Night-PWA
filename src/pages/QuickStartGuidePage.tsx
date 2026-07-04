import { RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";
import QuickStartStepCard from "../components/QuickStartStepCard";
import {
  getQuickStartItemKey,
  LocalizedGuideText,
  quickStartGuide,
  QuickStartStep
} from "../data/quickStartGuide";
import { Language } from "../i18n/translations";
import { useLanguage } from "../i18n/useLanguage";
import { formatText } from "../utils/format";
import {
  clearQuickStartProgress,
  getQuickStartProgress,
  setQuickStartProgress
} from "../utils/storage";

function getGuideText(text: LocalizedGuideText, language: Language) {
  return text[language] ?? text.en;
}

function getGuideTextList(
  items: LocalizedGuideText[] | undefined,
  language: Language
) {
  return items?.map((item) => getGuideText(item, language)) ?? [];
}

function isStepComplete(step: QuickStartStep, completedItemSet: Set<string>) {
  return step.checklistItems.every((_, index) =>
    completedItemSet.has(getQuickStartItemKey(step.id, index))
  );
}

export default function QuickStartGuidePage() {
  const slug = "community-guide";
  const { language, t } = useLanguage();
  const [completedItemKeys, setCompletedItemKeys] = useState<string[]>(() =>
    getQuickStartProgress(slug)
  );
  const [expandedStepIds, setExpandedStepIds] = useState<string[]>(() => [
    quickStartGuide.steps[0]?.id ?? ""
  ]);

  useEffect(() => {
    setCompletedItemKeys(getQuickStartProgress(slug));
  }, [slug]);

  const completedItemSet = useMemo(
    () => new Set(completedItemKeys),
    [completedItemKeys]
  );
  const completedStepCount = quickStartGuide.steps.filter((step) =>
    isStepComplete(step, completedItemSet)
  ).length;
  const totalStepCount = quickStartGuide.steps.length;
  const progressPercent =
    totalStepCount > 0 ? (completedStepCount / totalStepCount) * 100 : 0;
  const setupComplete = completedStepCount === totalStepCount;

  function handleToggleItem(itemKey: string) {
    setCompletedItemKeys((currentKeys) => {
      const nextSet = new Set(currentKeys);

      if (nextSet.has(itemKey)) {
        nextSet.delete(itemKey);
      } else {
        nextSet.add(itemKey);
      }

      const nextKeys = Array.from(nextSet);
      setQuickStartProgress(slug, nextKeys);
      return nextKeys;
    });
  }

  function handleToggleDetails(stepId: string) {
    setExpandedStepIds((currentIds) =>
      currentIds.includes(stepId)
        ? currentIds.filter((id) => id !== stepId)
        : [...currentIds, stepId]
    );
  }

  function handleReset() {
    if (!window.confirm(t("guide.confirmReset"))) {
      return;
    }

    clearQuickStartProgress(slug);
    setCompletedItemKeys([]);
    setExpandedStepIds([quickStartGuide.steps[0]?.id ?? ""]);
  }

  return (
    <main className="app-shell page-with-nav quick-guide-page">
      <AppHeader />

      <section className="panel quick-guide-hero">
        <p className="eyebrow">{t("guide.subtitle")}</p>
        <h1>{t("guide.heading")}</h1>
        <p className="muted">
          {formatText(t("guide.progressTemplate"), {
            completed: completedStepCount,
            total: totalStepCount
          })}
        </p>
        <div className="progress-track">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        {setupComplete ? (
          <div className="quick-complete-banner">
            <Sparkles size={18} aria-hidden="true" />
            <strong>
              {getGuideText(quickStartGuide.completionMessage, language)}
            </strong>
          </div>
        ) : null}
        <button
          className="secondary-button"
          disabled={completedItemKeys.length === 0}
          onClick={handleReset}
          type="button"
        >
          <RotateCcw size={18} aria-hidden="true" />
          <span>{t("guide.resetButton")}</span>
        </button>
      </section>

      <div className="quick-step-list">
        {quickStartGuide.steps.map((step, index) => {
          const stepComplete = isStepComplete(step, completedItemSet);

          return (
            <QuickStartStepCard
              checklistItems={getGuideTextList(step.checklistItems, language)}
              checklistLabel={t("guide.checklistLabel")}
              completeLabel={t("guide.stepComplete")}
              completedItemKeys={completedItemSet}
              details={getGuideTextList(step.details, language)}
              expanded={expandedStepIds.includes(step.id)}
              hideDetailsLabel={t("guide.hideDetails")}
              isComplete={stepComplete}
              key={step.id}
              onToggleDetails={() => handleToggleDetails(step.id)}
              onToggleItem={handleToggleItem}
              reminders={getGuideTextList(step.reminders, language)}
              reminderLabel={t("guide.reminderLabel")}
              showDetailsLabel={t("guide.showDetails")}
              stepId={step.id}
              stepLabel={formatText(t("guide.stepTemplate"), {
                step: index + 1
              })}
              summary={getGuideText(step.summary, language)}
              title={getGuideText(step.title, language)}
              warningLabel={t("guide.warningLabel")}
              warningNotes={getGuideTextList(step.warningNotes, language)}
            />
          );
        })}
      </div>

      <BottomNav />
    </main>
  );
}
