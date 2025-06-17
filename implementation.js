async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { 
      action, 
      query, 
      url,
      gl, 
      num,
      tbs
    } = params;
    const {
      serpApiKey,
      serpZone,
      unlockerApiKey,
      unlockerZone,
      openaiApiKey,
      openaiModel = 'gpt-4.1-mini'
    } = userSettings;

    const serpResultsSchema = {
      "type": "object",
      "properties": {
        "search_results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source_name": { "type": ["string", "null"], "description": "Name of the source or domain" },
              "title": { "type": ["string", "null"], "description": "Title of the search result" },
              "excerpt": { "type": ["string", "null"], "description": "Snippet or description of the search result" },
              "url": { "type": ["string", "null"], "description": "Complete URL of the search result without recognizable tracking codes" }
            },
            "required": ["source_name", "title", "excerpt", "url"],
            "additionalProperties": false
          }
        }
      },
      "required": ["search_results"],
      "additionalProperties": false
    };

    const webUnlockerContentSchema = {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "properties": {
            "title": { "type": ["string", "null"], "description": "Main content headline or title" },
            "content": { "type": ["string", "null"], "description": "Clean text content of the main body without HTML tags, line breaks, or non-essential information" },
            "additional_research_queries": { 
              "type": "array", 
              "items": { "type": "string" },
              "maxItems": 5,
              "description": "Array of targeted research queries (2-10 words each) for finding related information" 
            },
            "url": { "type": "string", "description": "The URL that was processed" }
          },
          "required": ["title", "content", "additional_research_queries", "url"],
          "additionalProperties": false
        }
      },
      "required": ["data"],
      "additionalProperties": false
    };

    function extractBodyContent(html) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) return bodyMatch[1];
      return html;
    }

    function isHtmlContent(content) {
      if (!content || typeof content !== 'string') return false;
      const trimmedContent = content.trim().toLowerCase();
      const htmlPatterns = [
        /^<!doctype\s+html/i, /^<html/i, /^<\?xml.*\?>/i,
        /<html[\s>]/i, /<head[\s>]/i, /<body[\s>]/i,
        /<title[\s>]/i, /<meta[\s>]/i, /<div[\s>]/i,
        /<p[\s>]/i, /<span[\s>]/i, /<article[\s>]/i,
        /<section[\s>]/i, /<header[\s>]/i, /<footer[\s>]/i,
        /<nav[\s>]/i, /<main[\s>]/i
      ];
      return htmlPatterns.some(pattern => pattern.test(trimmedContent));
    }

    function getContentProcessingType(content, contentType = '', url = '') {
      const contentTypeLower = contentType.toLowerCase();
      const urlLower = url.toLowerCase();
      if (contentTypeLower.includes('text/html') || contentTypeLower.includes('application/xhtml')) return 'html';
      if (contentTypeLower.includes('application/json') || contentTypeLower.includes('text/json')) return 'json';
      if (contentTypeLower.includes('application/xml') || contentTypeLower.includes('text/xml')) return 'xml';
      if (contentTypeLower.includes('application/javascript') || contentTypeLower.includes('text/javascript')) return 'javascript';
      if (contentTypeLower.includes('text/css')) return 'css';
      if (contentTypeLower.includes('text/plain')) return 'text';
      if (urlLower.endsWith('.json')) return 'json';
      if (urlLower.endsWith('.xml') || urlLower.endsWith('.rss') || urlLower.endsWith('.atom')) return 'xml';
      if (urlLower.endsWith('.js') || urlLower.endsWith('.mjs')) return 'javascript';
      if (urlLower.endsWith('.css')) return 'css';
      if (urlLower.endsWith('.txt')) return 'text';
      if (isHtmlContent(content)) return 'html';
      try { JSON.parse(content); return 'json'; } catch (e) {}
      if (content.trim().startsWith('<?xml')) return 'xml';
      return 'unsupported';
    }

    function buildGoogleSearchUrl(query, searchParams) {
      const baseUrl = 'https://www.google.com/search';
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (searchParams.gl) {
        params.append('gl', searchParams.gl);
      }
      
      if (Number.isInteger(searchParams
