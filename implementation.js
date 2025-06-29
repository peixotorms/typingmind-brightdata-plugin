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

    function extractBodyContent(html) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) return bodyMatch[1];
      return html;
    }

    function buildGoogleSearchUrl(query, searchParams) {
      const baseUrl = 'https://www.google.com/search';
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (searchParams.gl) {
        params.append('gl', searchParams.gl);
      }
      
      if (Number.isInteger(searchParams.num) && searchParams.num >= 10 && searchParams.num <= 100 && searchParams.num % 10 === 0) {
        params.append('num', searchParams.num.toString());
      } else {
        params.append('num', '10');
      }

      if (searchParams.tbs) {
        params.append('tbs', searchParams.tbs);
      }

      return `${baseUrl}?${params.toString()}`;
    }

    if (action === 'search') {
      if (!serpApiKey)
        return { success: false, error: 'BrightData SERP API key not configured. Please set it in plugin settings.' };
      if (!openaiApiKey)
        return { success: false, error: 'OpenAI API key not configured. Please set it in plugin settings.' };
      if (!query)
        return { success: false, error: 'Query is required for search action.' };

      try {
        const searchParams = {
          gl: gl || 'us',
          num: num || 10,
          tbs: tbs
        };

        const searchQueries = Array.isArray(query) ? query.slice(0, 5) : [query];

        const searchPromises = searchQueries.map(async (searchQuery, index) => {
          try {
            const searchUrl = buildGoogleSearchUrl(searchQuery, searchParams);
            const response = await fetch('https://api.brightdata.com/request', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${serpApiKey}` 
              },
              body: JSON.stringify({ 
                zone: serpZone, 
                url: searchUrl, 
                format: 'raw' 
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              return { 
                query: searchQuery, 
                index, 
                success: false, 
                error: `BrightData SERP API error for query '${searchQuery}' (${response.status}): ${errorText}` 
              };
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
              response_format: { 
                type: "json_schema", 
                json_schema: { 
                  name: "search_results", 
                  strict: true, 
                  schema: serpResultsSchema 
                }
              },
              max_tokens: 8000,
              temperature: 0
            };

            const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${openaiApiKey}` 
              },
              body: JSON.stringify(extractRequestBody)
            });

            if (!extractResponse.ok) {
              const errorText = await extractResponse.text();
              return { 
                query: searchQuery, 
                index, 
                success: false, 
                error: `OpenAI extraction error for query '${searchQuery}': Server error (${extractResponse.status}) - ${errorText}` 
              };
            }

            const extractResult = await extractResponse.json();
            const extractedContent = extractResult.choices[0]?.message?.content;
            if (!extractedContent) {
              return { 
                query: searchQuery, 
                index, 
                success: false, 
                error: `No extraction result from OpenAI for query '${searchQuery}'` 
              };
            }

            const parsedResults = JSON.parse(extractedContent);
            return {
              query: searchQuery,
              index,
              success: true,
              results: parsedResults.search_results || []
            };

          } catch (error) {
            return { 
              query: searchQuery, 
              index, 
              success: false, 
              error: `Search error for query '${searchQuery}': ${error.message}` 
            };
          }
        });

        const searchResults = await Promise.all(searchPromises);

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
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!url)
        return { success: false, error: 'URL is required for fetch action.' };

      try {
        const urlsToProcess = Array.isArray(url) ? url : [url];

        const fetchPromises = urlsToProcess.map(async (targetUrl) => {
          try {
            const response = await fetch('https://api.brightdata.com/request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${unlockerApiKey}`
              },
              body: JSON.stringify({ 
                zone: unlockerZone, 
                url: targetUrl, 
                format: 'raw',
                data_format: 'markdown'
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              return {
                url: targetUrl,
                success: false,
                error: `BrightData Web Unlocker API error for URL '${targetUrl}' (${response.status}): ${errorText}`
              };
            }

            const markdownContent = await response.text();

            return {
              url: targetUrl,
              success: true,
              content: markdownContent,
              content_type: "markdown"
            };

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
