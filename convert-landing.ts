import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');

// replace body with root div
// but save body innerHTML to a LandingPage.tsx
const bodyRegex = /<body[^>]*>([\s\S]*)<\/body>/i;
const bodyMatch = html.match(bodyRegex);

if (bodyMatch) {
  let bodyContent = bodyMatch[1];
  
  // also inject react-router-dom navigate handler
  const landingPageTsx = `
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Intercept vanilla links in the injected HTML to use React Router
    const handleNavigation = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target) {
        const href = target.getAttribute('href');
        if (href === '/screener' || href === '/screener.html') {
          e.preventDefault();
          navigate('/screener');
        }
      }
    };
    
    document.addEventListener('click', handleNavigation);
    return () => document.removeEventListener('click', handleNavigation);
  }, [navigate]);

  return <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${bodyContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\` }} />;
}
`;
  fs.writeFileSync('src/components/LandingPage.tsx', landingPageTsx);

  const headRegex = new RegExp("(<head[^>]*>[\\\\s\\\\S]*<\\\\/head>)", "i");
  const headMatch = html.match(headRegex);
  let headContent = '';
  if (headMatch) {
     headContent = headMatch[1];
  } else {
     // fallback
     headContent = html.split('<body')[0] || '';
  }

  const newIndexHtml = `<!DOCTYPE html>
<html lang="en" class="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Free NSE Option Chain Screener | NIFTY F&O Analytics India</title>
    <!-- Tailwind CSS CDN for the legacy HTML -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
<body class="text-[#111827] bg-[#f9fafb] min-h-screen antialiased select-none font-sans">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  fs.writeFileSync('index.html', newIndexHtml);
  console.log("Converted successfully!");
} else {
  console.log("Could not match body");
}
