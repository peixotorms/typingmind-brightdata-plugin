async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { 
      action, 
      query, 
      url,
      tbm, 
      ibp, 
      gl, 
      hl, 
      start,
      num
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
      if (searchParams.tbm) params.append('tbm', searchParams.tbm);
      if (searchParams.ibp) params.append('ibp', searchParams.ibp);
      if (searchParams.gl) params.append('gl', searchParams.gl);
      if (searchParams.hl) params.append('hl', searchParams.hl);

      if (Number.isInteger(searchParams.start) && searchParams.start >= 0) {
        params.append('start', searchParams.start.toString());
      }
      if (Number.isInteger(searchParams.num) && searchParams.num > 0) {
        params.append('num', searchParams.num.toString());
      } else {
        params.append('num', '10');
      }

      return `${baseUrl}?${params.toString()}`;
    }

    if (action === 'search') {
      // SEARCH ACTION: Execute multiple queries in parallel, return search results
      if (!serpApiKey)
        return { success: false, error: 'BrightData SERP API key not configured. Please set it in plugin settings.' };
      if (!openaiApiKey)
        return { success: false, error: 'OpenAI API key not configured. Please set it in plugin settings.' };
      if (!query)
        return { success: false, error: 'Query is required for search action.' };

      try {
        const searchParams = {
          tbm,
          ibp,
          gl: gl || 'us',
          hl: hl || 'en',
          start,
          num
        };

        // Handle multiple queries - support both string and array
        const searchQueries = Array.isArray(query) ? query.slice(0, 5) : [query];

        // Execute all searches in parallel
        const searchPromises = searchQueries.map(async (searchQuery, index) => {
          try {
            const searchUrl = buildGoogleSearchUrl(searchQuery, searchParams);
            const response = await fetch('https://api.brightdata.com/request', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serpApiKey}` },
              body: JSON.stringify({ zone: serpZone, url: searchUrl, format: 'raw' })
            });

            if (!response.ok) {
              const errorText = await response.text();
              return { query: searchQuery, index, success: false, error: `BrightData SERP API error for query '${searchQuery}' (${response.status}): ${errorText}` };
            }

            const htmlResult = await response.text();
            const bodyContent = extractBodyContent(htmlResult);

            const extractPrompt = `Extract search results from this Google search HTML content for the query: "${searchQuery}". 

Extract all real search results (do not invent or summarize). Maintain original URLs without modification.

HTML Content:
${bodyContent}`;

            const extractRequestBody = {
              model: openaiModel,
              messages: [{ role: "user", content: extractPrompt }],
              response_format: { type: "json_schema", json_schema: { name: "search_results", strict: true, schema: serpResultsSchema }},
              max_tokens: 8000,
              temperature: 0
            };

            const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
              body: JSON.stringify(extractRequestBody)
            });

            if (!extractResponse.ok) {
              const errorText = await extractResponse.text();
              return { query: searchQuery, index, success: false, error: `OpenAI extraction error for query '${searchQuery}': Server error (${extractResponse.status}) - ${errorText}` };
            }

            const extractResult = await extractResponse.json();
            const extractedContent = extractResult.choices[0]?.message?.content;
            if (!extractedContent) {
              return { query: searchQuery, index, success: false, error: `No extraction result from OpenAI for query '${searchQuery}'` };
            }

            const parsedResults = JSON.parse(extractedContent);
            return {
              query: searchQuery,
              index,
              success: true,
              results: parsedResults.search_results || []
            };

          } catch (error) {
            return { query: searchQuery, index, success: false, error: `Search error for query '${searchQuery}': ${error.message}` };
          }
        });

        const searchResults = await Promise.all(searchPromises);

        // Combine and deduplicate results
        const seenUrls = new Set();
        const combinedResults = [];

        searchResults.forEach(searchResult => {
          if (searchResult.success && searchResult.results) {
            searchResult.results.forEach(result => {
              if (result.url && !seenUrls.has(result.url)) {
                seenUrls.add(result.url);
                combinedResults.push(result);
              }
            });
          }
        });

        return {
          success: true,
          action: 'search',
          search_results: combinedResults,
          total_results: combinedResults.length,
          queries_executed: searchQueries,
          search_details: searchResults
        };

      } catch (error) {
        return { success: false, error: `Search workflow error: ${error.message}` };
      }

    } else if (action === 'fetch') {
      // FETCH ACTION: Open multiple URLs in parallel, return content
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!url)
        return { success: false, error: 'URL is required for fetch action.' };

      try {
        // Handle multiple URLs - support both string and array
        const urlsToProcess = Array.isArray(url) ? url : [url];

        // Fetch all URLs in parallel
        const fetchPromises = urlsToProcess.map(async (targetUrl) => {
          try {
            const response = await fetch('https://api.brightdata.com/request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${unlockerApiKey}`
              },
              body: JSON.stringify({ zone: unlockerZone, url: targetUrl, format: 'raw' })
            });

            if (!response.ok) {
              const errorText = await response.text();
              return {
                url: targetUrl,
                success: false,
                error: `BrightData Web Unlocker API error for URL '${targetUrl}' (${response.status}): ${errorText}`
              };
            }

            const rawContent = await response.text();
            const contentType = response.headers.get('content-type') || '';
            const processingType = getContentProcessingType(rawContent, contentType, targetUrl);

            if (processingType === 'html' && openaiApiKey) {
              const bodyContent = extractBodyContent(rawContent);
              
              try {
                const extractPrompt = `Extract the main content from this HTML webpage.

Instructions:
1. Extract ONLY the main content body as clean text
2. Remove navigation, ads, etc.
3. Preserve <pre>, <code> HTML tags, remove all other HTML tags
4. Remove line breaks
5. Generate 3-5 targeted research queries (2-10 words each)

URL: ${targetUrl}
HTML Content:
${bodyContent}`;

                const extractRequestBody = {
                  model: openaiModel,
                  messages: [{ role: "user", content: extractPrompt }],
                  response_format: { type: "json_schema", json_schema: { name: "content", strict: true, schema: webUnlockerContentSchema }},
                  max_tokens: 32768,
                  temperature: 0
                };

                const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
                  body: JSON.stringify(extractRequestBody)
                });

                if (extractResponse.ok) {
                  const extractResult = await extractResponse.json();
                  const extractedContent = extractResult.choices[0]?.message?.content;
                  if (extractedContent) {
                    const parsedContent = JSON.parse(extractedContent);
                    return {
                      url: targetUrl,
                      success: true,
                      content: parsedContent.data,
                      content_type: "html"
                    };
                  }
                }
                
                // AI extraction failed, return raw content
                return {
                  url: targetUrl,
                  success: true,
                  content: {
                    title: null,
                    content: bodyContent,
                    additional_research_queries: [],
                    url: targetUrl
                  },
                  content_type: "html"
                };

              } catch (aiError) {
                // AI processing failed, return raw content
                return {
                  url: targetUrl,
                  success: true,
                  content: {
                    title: null,
                    content: bodyContent,
                    additional_research_queries: [],
                    url: targetUrl
                  },
                  content_type: "html"
                };
              }
            } else {
              // Non-HTML content or no OpenAI key - return as-is
              return {
                url: targetUrl,
                success: true,
                content: {
                  title: null,
                  content: rawContent,
                  additional_research_queries: [],
                  url: targetUrl
                },
                content_type: processingType
              };
            }

          } catch (error) {
            return {
              url: targetUrl,
              success: false,
              error: `Fetch error for URL '${targetUrl}': ${error.message}`
            };
          }
        });

        const fetchResults = await Promise.all(fetchPromises);

        return {
          success: true,
          action: 'fetch',
          results: fetchResults,
          total_urls: urlsToProcess.length
        };

      } catch (error) {
        return { success: false, error: `Fetch workflow error: ${error.message}` };
      }

    } else {
      return { success: false, error: 'Invalid action. Must be "search" or "fetch".' };
    }

  } catch (error) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
