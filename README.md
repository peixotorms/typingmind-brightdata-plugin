# BrightData Web Fetcher Plugin for TypingMind

A minimalist TypingMind plugin that automatically fetches web content and search results using BrightData API based on natural language instructions.

## Features

- **Automatic Web Search**: Just ask the AI to search for something and it will automatically use Google search via BrightData SERP API
- **Webpage Fetching**: Provide any URL and the AI will fetch and read the content using BrightData Web Unlocker API
- **Multiple Search Types**: Supports web, news, images, videos, shopping, and scholar searches
- **Natural Language**: No commands needed - just talk naturally to the AI
- **Secure Configuration**: API keys are stored securely in plugin settings

## Usage Examples

### Search Examples
- "Search for the latest news about AI developments"
- "Look up current Bitcoin price"
- "Find information about climate change"
- "What are the latest tech trends?"
- "Search for pizza recipes"

### Webpage Fetching Examples
- "Read this article: https://example.com/article"
- "What does this page say: https://news.site.com"
- "Analyze this website: https://company.com"
- "Get the content from https://blog.example.com"

## Setup

1. Import this plugin to TypingMind
2. Configure your BrightData API key in plugin settings
3. Set your SERP and Web Unlocker zone IDs (optional - defaults provided)
4. Enable automatic web fetching
5. Start chatting naturally with the AI!

## Requirements

- BrightData API account with SERP API and Web Unlocker access
- Valid API key and zone configurations

## API Endpoints Used

- **SERP API**: For web searches via Google
- **Web Unlocker API**: For fetching individual web pages

The plugin automatically chooses the right API based on your request context.
