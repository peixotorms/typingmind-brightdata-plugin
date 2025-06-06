# BrightData Web Fetcher — TypingMind Plugin

Automatically search or fetch web content using BrightData APIs (SERP & Web Unlocker) based on natural language instructions.

## Features

- **Natural‑language Web Search**: Ask the AI to search for something (e.g. "Search for the latest AI news") and it will use the BrightData SERP API.
- **Webpage Fetching**: Provide a URL (e.g. "Read this article: https://example.com") and the AI will fetch and read the page via BrightData Web Unlocker API.
- **Multiple Search Types**: Supports `web`, `news`, `images`, `videos`, `shopping`, and `scholar`.
- **No Commands Needed**: AI infers when to search vs. fetch based on your request—no slash‑commands.
- **Secure, Separate Settings**: Configure SERP API key/zone and Unlocker API key/zone independently.

## Setup

1. Push these three files (`plugin.json`, `implementation.js`, `README.md`) to a **public** GitHub repo, e.g.  
   `https://github.com/peixotorms/typingmind-brightdata-plugin`
2. In TypingMind, go to **Plugins → Import plugins → GitHub URL**, and paste your repo URL.
3. Open the plugin’s **Settings** and enter:
   - **BrightData SERP API Key**
   - **SERP Zone ID** (default: `serp_api1_web_search`)
   - **BrightData Web Unlocker API Key**
   - **Web Unlocker Zone ID** (default: `web_unlocker1`)
   - **Enable Automatic Web Fetching** → `true`
4. Chat naturally—ask it to search or fetch pages and enjoy live web results!

## Requirements

- BrightData account with SERP & Web Unlocker access.
- Valid API Keys and Zone IDs.
