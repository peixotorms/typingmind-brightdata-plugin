## BrightData Web Fetcher — TypingMind Plugin

Automatically search or fetch web content using BrightData APIs (SERP & Web Unlocker) based on natural language instructions and parse large HTML or structured responses through OpenAI to extract relevant, clean JSON data.

## Features

- **Parallel Web Search & Fetch**  
  Search Google using BrightData SERP API (multiple queries in parallel), or fetch webpage content with Web Unlocker API (multiple URLs in parallel).

- **Full Google `gl` and `hl` RAG Support**  
  Uses all Google-supported `gl` (country) and `hl` (language) codes for precise localization and retrieval-augmented generation (RAG). The AI is aware it can use any supported value.

- **Content Extraction for All Web Content**  
  For HTML, uses OpenAI to extract only the main readable content as structured JSON (works for articles, docs, blogs, forums, etc). For JSON, XML, JS, CSS, or plain text, returns the raw content as-is.

- **Minimal Commands**  
  Plain, natural language instructions (“find Paris climate news”), handled contextually without the need for explicit commands.

- **Advanced Pagination & Filtering**  
  Supports `start`, `num`, `tbm` (news/shopping), and job search with `ibp`. Combine as needed for advanced queries.

- **Highly Efficient for Research**  
  Parallelizes OpenAI extraction calls for fast processing of many URLs or searches.

- **Secure & Modular**  
  Separate SERP and Web Unlocker keys/zones, and secure OpenAI key management.

## OpenAI

- **Why Use OpenAI for Extraction?**  
  Large web pages and search result HTML can exceed model context windows. This plugin parses and extracts only the structured, important content via OpenAI before handing results to the chat, minimizing context/token usage.

- **Best Models**  
  Defaults to high-context models (like `gpt-4.1-mini`) for reliability with large or complex results.

## Setup

1. In TypingMind, go to **Plugins → Import plugins → GitHub URL**, and paste the repo URL (or upload plugin scripts).
2. Open plugin **Settings** and provide:
   - **BrightData SERP API Key**
   - **SERP Zone ID**
   - **BrightData Web Unlocker API Key**
   - **Web Unlocker Zone ID**
   - **OpenAI API Key**
   - **OpenAI Model** to use
3. Start your research! Ask natural-language questions—the plugin handles all search/fetch actions and delivers clean, readable, local-language-aware results.

## Requirements

- BrightData account with SERP & Web Unlocker access and sufficient credit.
- Valid BrightData API keys and zone IDs.
- Valid OpenAI API Key and sufficient credit.
- TypingMind platform with plugin support.

## Supported Parameters

- **action**: `"search"` (Google SERP API) or `"fetch"` (Web Unlocker API)
- **query**: Single query **OR** multiple queries (array) for searching in parallel
- **url**: Single URL **OR** multiple URLs (array) for fetching in parallel
- **tbm**: `"nws"` (news), `"shop"` (shopping)
- **ibp**: `"htl;jobs"` for jobs
- **gl**: Any valid Google [country code](https://developers.google.com/custom-search/docs/xml_results_appendices#countryCodes)
- **hl**: Any valid Google [language code](https://developers.google.com/custom-search/docs/xml_results_appendices#languages)
- **start**: Results offset (pagination)
- **num**: Number of results per query

The RAG (retrieval-augmented generation) coverage includes **all Google-supported gl and hl codes**.

---
