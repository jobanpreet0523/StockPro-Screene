import React from 'react';

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StockPro',
  url: 'https://stockpro1.qzz.io/',
  description: 'Educational market analytics, screening tools, and clearly labelled delayed or provider-backed data.',
};

const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'StockPro',
  url: 'https://stockpro1.qzz.io/',
  description: 'A market research workspace for educational analytics, screening, option-chain context, and data-source transparency.',
};

export default function StructuredData() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
