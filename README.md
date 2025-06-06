# BrightData Web Fetcher — TypingMind Plugin

Automatically search or fetch web content using BrightData APIs (SERP & Web Unlocker) based on natural language instructions and parse the large HTML response through OpenAI to extract relevant json data.

## Features

- **Natural‑language Web Search**: Ask the AI to search for something (e.g. "Search for the latest AI news") and it will use the BrightData SERP API to search and then parse the large HTML response through OpenAI to extract the search results as json.
- **Webpage Fetching**: Provide a URL (e.g. "Read this article: https://example.com") and the AI will fetch and read the page via BrightData Web Unlocker API and then parse the large HTML response through OpenAI to extract the search results as json.
- **Multiple Search Types**: Supports `web`, `news`, `images`, `videos`, `shopping`, and `scholar`.
- **No Commands Needed**: AI infers when to search vs. fetch based on your request—no slash‑commands.
- **Secure, Separate Settings**: Configure SERP API key/zone and Unlocker API key/zone independently.

## OpenAI

- **Why do we parse the results via OpenAI?**: When we fetch an article, then perform search results and access each result, the combined HTML data can easily exceed the context window in most models. To avoid that, we parse each HTML page via OpenAI to extract only the minimum required information, before feeding it to the chat window for further processing, thus lowering the requirements for the context window.
- **Which models are recommended**: The plugin limits the models to those with higher context windows to ensure that there is enough context to process each search result in case of detailed research.

## Setup

1. In TypingMind, go to **Plugins → Import plugins → GitHub URL**, and paste the repo URL.
2. Open the plugin's **Settings** and enter:
   - **BrightData SERP API Key**
   - **SERP Zone ID** 
   - **BrightData Web Unlocker API Key**
   - **Web Unlocker Zone ID** 
   - **OpenAI API Key**
   - **OpenAI Model**
3. Chat naturally—ask it to search or fetch pages and enjoy live web results!

## Requirements

- BrightData account with SERP & Web Unlocker access with enough credit.
- Valid BrightData API Keys and Zone IDs.
- Valid OpenAI API Key with enough credit.
- Selection of the default OpenAI model for cleaning up the HTML responses.