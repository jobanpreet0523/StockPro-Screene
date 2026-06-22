import React from 'react';
import NewsView from '../components/NewsView';
import { useSeoTags } from '../hooks/useSeoTags';

export default function NewsPage() {
  useSeoTags({
    title: "Latest Stock Market News | StockPro Real-time Feed",
    description: "Stay ahead with live market updates, corporate announcements, and economic trends from top sources."
  });
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="news-section">
      <NewsView />
    </div>
  );
}
