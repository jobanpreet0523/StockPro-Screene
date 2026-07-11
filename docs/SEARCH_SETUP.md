# Search Setup

The browser may receive only `VITE_ALGOLIA_APP_ID` and `VITE_ALGOLIA_SEARCH_KEY`. Keep `ALGOLIA_ADMIN_KEY`, `ALGOLIA_STOCK_INDEX`, and `ALGOLIA_CONTENT_INDEX` on the backend or deployment system.

Use a restricted search-only key with index and rate limits. Index real stock, sector, article, screen-library, company, and CRT documentation records only. When credentials or indexes are missing, the UI reports `setup_required` and returns no synthetic results.
