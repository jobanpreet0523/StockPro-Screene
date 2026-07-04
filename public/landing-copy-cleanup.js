(() => {
  const isLanding = location.pathname === '/' || location.pathname === '/landing';
  if (!isLanding) return;

  function replaceText() {
    const replacements = [
      [/Access Pro Terminal/g, 'Access Free Terminal'],
      [/Access PRO Terminal/g, 'Access Free Terminal'],
      [/Pro Derivatives Terminal/g, 'Free Derivatives Terminal'],
      [/F&O Analytics Pro/g, 'F&O Analytics Terminal'],
      [/VIEW PRICING/g, 'FREE ACCESS'],
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      let value = textNode.nodeValue || '';
      let next = value;
      replacements.forEach(([pattern, replacement]) => {
        next = next.replace(pattern, replacement);
      });
      if (next !== value) textNode.nodeValue = next;
    });

    document.querySelectorAll('.sp-hero-glass-panel').forEach((el) => el.remove());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceText, { once: true });
  } else {
    replaceText();
  }

  const observer = new MutationObserver(replaceText);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
