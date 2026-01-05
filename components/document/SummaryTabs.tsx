"use client";

import { useState } from "react";
import SlideSummaryView from "./SlideSummaryView";
import FullSummaryView from "./FullSummaryView";
import RecordingView from "./RecordingView";

interface SlideSummary {
  slideNumber: number;
  title: string;
  summaryContent: any; // TipTap JSON
  userNotesContent: any; // TipTap JSON
  audioSegments: any[];
}

interface SummaryTabsProps {
  documentId: string;
  slideSummaries: SlideSummary[];
  fullSummary: any;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
}

type TabType = "slide" | "full" | "recording";

export default function SummaryTabs({
  documentId,
  slideSummaries,
  fullSummary,
  currentSlide,
  onSlideChange,
}: SummaryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("slide");

  const tabs = [
    { id: "slide" as TabType, label: "슬라이드별 요약" },
    { id: "full" as TabType, label: "전체 요약" },
    { id: "recording" as TabType, label: "녹음" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 font-medium text-sm transition-colors relative
                ${activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-gray-800"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "slide" && (
          <SlideSummaryView
            documentId={documentId}
            slideSummaries={slideSummaries}
            currentSlide={currentSlide}
            onSlideChange={onSlideChange}
          />
        )}
        {activeTab === "full" && (
          <FullSummaryView
            fullSummary={fullSummary}
            documentId={documentId}
          />
        )}
        {activeTab === "recording" && (
          <RecordingView documentId={documentId} />
        )}
      </div>
    </div>
  );
}

