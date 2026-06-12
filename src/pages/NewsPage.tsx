import React from 'react';
import NewsView from '../components/NewsView';

export default function NewsPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="news-section">
      <NewsView />
    </div>
  );
}
