import React from 'react';
import BlogView from '../components/BlogView';

export default function BlogPage() {
  return (
    <div className="lg:col-span-12 flex flex-col gap-6" id="blog-section">
      <BlogView />
    </div>
  );
}
