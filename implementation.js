async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { 
      action, 
      query, 
      tbm, 
      ibp, 
      gl, 
      hl, 
      start, 
      num, 
      url 
    } = params;
    const {
      serpApiKey,
      serpZone,
      unlockerApiKey,
      unlockerZone,
      openaiApiKey,
      openaiModel = 'gpt-4.1-mini'
    } = userSettings;

    // Parameter options (for AI reference - RAG)
    const GOOGLE_GL_OPTIONS = [ /* ...country codes list (see above)... */ ];
    const GOOGLE_HL_OPTIONS = [ /* ...language codes list (see above)... */ ];

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
      if (content.trim().startsWith('<?xml') || content.trim().startsWith('<')) return 'xml';
      return 'unsupported';
    }

    function buildGoogleSearchUrl(query, searchParams) {
      const baseUrl = 'https://www.google.com/search';
      const params = new URLSearchParams();
      params.append('q', query);
      if (searchParams.tbm) params.append('tbm', searchParams.tbm);
      if (searchParams.ibp) params.append('ibp', searchParams.ibp);
      if (searchParams.gl) params.append('gl', searchParams.gl);
      if (searchParams.hl) params.append('hl', searchParams.hl);
      if (searchParams.start !== undefined) params.append('start', searchParams.start.toString());
      if (searchParams.num !== undefined) params.append('num', searchParams.num.toString());
      return `${baseUrl}?${params.toString()}`;
    }

    // Content schema (generic)
    const contentSchema = {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "properties": {
            "title": { "type": ["string", "null"], "description": "Main content headline or title" },
            "content": { "type": ["string", "null"], "description": "Clean text content of the main body without HTML tags, line breaks, or non-essential information" },
            "target_research": { "type": ["string", "null"], "description": "Targeted research query (2-10 words) based on the main topic to find additional information" }
          },
          "required": ["title", "content", "target_research"],
          "additionalProperties": false
        }
      },
      "required": ["data"],
      "additionalProperties": false
    };

    // SERP results schema
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

    // Helper for OpenAI
    async function processWithOpenAI(content, actionType, query = '', url = '') {
      if (!openaiApiKey) throw new Error('OpenAI API key not configured. Please set it in plugin settings.');
      let prompt, responseFormat;
      if (actionType === 'search') {
        prompt = `Extract search results from this Google search HTML content for the query: "${query}". 
IMPORTANT: Respond in the same language as the user's query.
REFERENCE: Google search parameters for RAG:
- gl: ${GOOGLE_GL_OPTIONS.join(', ')}
- hl: ${GOOGLE_HL_OPTIONS.join(', ')}
Extract all real search results (do not invent or summarize).`;
        responseFormat = { type: "json_schema", json_schema: { name: "search_results", strict: true, schema: serpResultsSchema }};
      } else if (actionType === 'fetch') {
        prompt = `Extract the main content from the HTML. Process as instructed, regardless of language. 
1. Extract ONLY the main content body as clean text.
2. Remove navigation, ads, etc.
3. Preserve <pre>, <code> HTML tags, remove all other HTML tags.
4. Remove line breaks.
5. Translate if needed, don't suggest alternatives.
6. Generate a targeted research query (2-10 words) in the user's language.
HTML Content:
${content}`;
        responseFormat = { type: "json_schema", json_schema: { name: "content", strict: true, schema: contentSchema }};
      }
      const requestBody = {
        model: openaiModel,
        messages: [{ role: "user", content: prompt }],
        response_format: responseFormat,
        max_tokens: 32768,
        temperature: 0
      };
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error(`OpenAI API error (${response.status}): ${await response.text()}`);
      const result = await response.json();
      const content_response = result.choices[0]?.message?.content;
      if (!content_response) throw new Error('No response generated from OpenAI');
      try {
        return JSON.parse(content_response);
      } catch (parseError) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
      }
    }

    // Fetch a single URL (for 'fetch' action)
    async function fetchSingleUrl(url) {
      try { new URL(url); } catch (_) {
        return {success: false, url, error: 'Invalid URL provided.' };
      }
      try {
        const response = await fetch('https://api.brightdata.com/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${unlockerApiKey}`
          },
          body: JSON.stringify({ zone: unlockerZone, url, format: 'raw' })
        });
        if (!response.ok) {
          const errorText = await response.text();
          return { success: false, url, error: `BrightData Web Unlocker API error (${response.status}): ${errorText}` };
        }
        const rawContent = await response.text();
        const contentType = response.headers.get('content-type') || '';
        const processingType = getContentProcessingType(rawContent, contentType, url);
        switch (processingType) {
          case 'html':
            const bodyContent = extractBodyContent(rawContent);
            const processedContent = await processWithOpenAI(bodyContent, 'fetch', '', url);
            return { success: true, url, content: processedContent, content_type: "html" };
          case 'json': case 'xml': case 'javascript': case 'css': case 'text':
            return { success: true, url, content: { data: { title: null, content: rawContent, target_research: null } }, content_type: processingType };
          case 'unsupported':
            return { success: false, url, error: `Unsupported content type: ${contentType}. This plugin only supports HTML, JSON, XML, JavaScript, CSS, and plain text files.` };
          default:
            return { success: true, url, content: { data: { title: null, content: rawContent, target_research: null } }, content_type: "text" };
        }
      } catch (error) {
        return { success: false, url, error: `Error fetching URL: ${error.message}` };
      }
    }

    // Main logic
    if (action === 'search') {
      if (!serpApiKey)
        return { success: false, error: 'BrightData SERP API key not configured. Please set it in plugin settings.' };
      if (!query)
        return { success: false, error: 'Query is required for search action.' };

      // Support multiple queries for parallel SERP search (up to 20)
      const queries = Array.isArray(query) ? query : [query];
      if (queries.length > 20)
        return { success: false, error: "Maximum 20 queries per request." };

      const searchParams = { tbm, ibp, gl, hl, start, num };
      const requests = queries.map(q => {
        const searchUrl = buildGoogleSearchUrl(q, searchParams);
        return fetch('https://api.brightdata.com/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serpApiKey}` },
          body: JSON.stringify({ zone: serpZone, url: searchUrl, format: 'raw' })
        })
          .then(async r => {
            if (!r.ok) {
              const errorText = await r.text();
              return { success: false, query: q, error: `BrightData SERP API error (${r.status}): ${errorText}` };
            }
            const htmlResult = await r.text();
            const bodyContent = extractBodyContent(htmlResult);
            const processedContent = await processWithOpenAI(bodyContent, 'search', q);
            return {
              success: true,
              query: q,
              search_params: searchParams,
              results: processedContent
            };
          })
          .catch(error => ({ success: false, query: q, error: `Fetch error: ${error.message}` }));
      });
      const results = await Promise.all(requests);
      return Array.isArray(query) ? { success: true, results, total_queries: queries.length } : results[0];

    } else if (action === 'fetch') {
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!url)
        return { success: false, error: 'URL is required for fetch action.' };

      // Allow an array of URLs, up to 20 at once
      const urls = Array.isArray(url) ? url : [url];
      if (urls.length > 20)
        return { success: false, error: "Maximum 20 URLs per request." };

      const results = await Promise.all(urls.map(fetchSingleUrl));
      return Array.isArray(url) ? {
        success: true,
        results,
        total_urls: urls.length
      } : results[0];

    } else {
      return { success: false, error: 'Invalid action. Must be either "search" or "fetch".' };
    }
  } catch (error) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
