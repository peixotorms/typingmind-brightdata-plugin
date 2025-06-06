async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { action, query, search_type = 'web', url } = params;
    const {
      serpApiKey,
      serpZone = 'serp_api1_web_search',
      unlockerApiKey,
      unlockerZone = 'web_unlocker1',
      openaiApiKey,
      openaiModel = 'gpt-4.1-mini'
    } = userSettings;

    // Helper function to extract body content from HTML
    function extractBodyContent(html) {
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
      // If no body tag found, return the entire HTML (fallback)
      return html;
    }

    // JSON schema for SERP results
    const serpResultsSchema = {
      "type": "object",
      "properties": {
        "search_results": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source_name": {
                "type": ["string", "null"],
                "description": "Name of the source or domain"
              },
              "title": {
                "type": ["string", "null"],
                "description": "Title of the search result"
              },
              "excerpt": {
                "type": ["string", "null"],
                "description": "Snippet or description of the search result"
              },
              "url": {
                "type": ["string", "null"],
                "description": "Complete URL of the search result without recognizable tracking codes"
              }
            },
            "required": ["source_name", "title", "excerpt", "url"],
            "additionalProperties": false
          }
        }
      },
      "required": ["search_results"],
      "additionalProperties": false
    };

    // JSON schema for article content
    const articleContentSchema = {
      "type": "object",
      "properties": {
        "article": {
          "type": "object",
          "properties": {
            "title": {
              "type": ["string", "null"],
              "description": "Main article headline"
            },
            "subtitle": {
              "type": ["string", "null"],
              "description": "Article subtitle or deck"
            },
            "tagline": {
              "type": ["string", "null"],
              "description": "Brief tagline or summary statement"
            },
            "category": {
              "type": ["string", "null"],
              "description": "Article category, section, or tag"
            },
            "author": {
              "type": ["string", "null"],
              "description": "Author name(s)"
            },
            "publisher": {
              "type": ["string", "null"],
              "description": "Publishing organization or website name"
            },
            "published_date": {
              "type": ["string", "null"],
              "description": "ISO 8601 formatted publication date"
            },
            "location": {
              "type": ["string", "null"],
              "description": "Country, State, City, relevant to the WHERE description of the article considering the complete article"
            },
            "highlights": {
              "type": ["array", "null"],
              "items": {
                "type": "string"
              },
              "description": "Key points, bullet points, or article highlights"
            },
            "body": {
              "type": ["string", "null"],
              "description": "Clean HTML content using only: h1, h2, h3, h4, h5, h6, p, ul, ol, li, a tags"
            },
            "images": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "url": {
                    "type": ["string", "null"],
                    "description": "Complete image URL or data encoded data url"
                  },
                  "caption": {
                    "type": ["string", "null"],
                    "description": "Image caption or description"
                  },
                  "copyright": {
                    "type": ["string", "null"],
                    "description": "Copyright notice or license information for the image"
                  }
                },
                "required": ["url", "caption", "copyright"],
                "additionalProperties": false
              }
            },
            "copyright": {
              "type": ["string", "null"],
              "description": "Article copyright information"
            }
          },
          "required": ["title", "subtitle", "tagline", "category", "author", "publisher", "published_date", "location", "highlights", "body", "images", "copyright"],
          "additionalProperties": false
        }
      },
      "required": ["article"],
      "additionalProperties": false
    };

    // Helper function to send content to OpenAI for processing
    async function processWithOpenAI(content, actionType, query = '', url = '') {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please set it in plugin settings.');
      }

      let prompt, responseFormat;
      
      if (actionType === 'search') {
        prompt = `Extract search results from this Google search HTML content for the query: "${query}". 

Find all search results and extract exactly what you see:
- source_name: The source name acronym, name, or domain name (e.g., CNN, BBC, Microsoft, "wikipedia.org", "example.com")
- title: The clickable title/headline of each result
- excerpt: The description or snippet text below the title
- url: The complete destination URL without recognizable tracking codes

Return only what is actually present in the search results. Do not invent or summarize.

HTML Content:
${content}`;
        responseFormat = {
          type: "json_schema",
          json_schema: {
            name: "search_results",
            strict: true,
            schema: serpResultsSchema
          }
        };
      } else if (actionType === 'fetch') {
        prompt = `Extract article content from this webpage HTML from: ${url}

Follow these exact requirements:
1. Extract all visible article content maintaining the original order and structure
2. Use ISO 8601 format for all dates (YYYY-MM-DDTHH:MM:SS±HH:MM)
3. If any field is not available, use null instead of empty strings
4. Convert body content to clean HTML using only: h1, h2, h3, h4, h5, h6, p, ul, ol, li, a tags
5. HTML tags must have NO attributes except href on <a> tags: <a href='complete_url'>text</a>
6. Extract all images separately with metadata
7. Remove copyright information from body and place in separate copyright field
8. Look for highlights, key points, or summary bullets
9. Extract exactly what is present - do not summarize or modify content
10. Remove all information regarding links or suggestions for other content, even if they show up inside the main article content.

HTML Content:
${content}`;
        responseFormat = {
          type: "json_schema",
          json_schema: {
            name: "article_content",
            strict: true,
            schema: articleContentSchema
          }
        };
      }

      const requestBody = {
        model: openaiModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: responseFormat,
        max_tokens: 4000,
        temperature: 0
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      const content_response = result.choices[0]?.message?.content;
      
      if (!content_response) {
        throw new Error('No response generated from OpenAI');
      }

      try {
        return JSON.parse(content_response);
      } catch (parseError) {
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError.message}`);
      }
    }

    // If we are performing a search action
    if (action === 'search') {
      if (!serpApiKey) {
        return {
          success: false,
          error: 'BrightData SERP API key not configured. Please set it in plugin settings.'
        };
      }
      if (!query) {
        return {
          success: false,
          error: 'Query is required for search action.'
        };
      }

      const encodedQuery = encodeURIComponent(query);
      let searchUrl;
      switch (search_type) {
        case 'web':
          searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
          break;
        case 'news':
          searchUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=nws`;
          break;
        case 'images':
          searchUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
          break;
        case 'videos':
          searchUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=vid`;
          break;
        case 'shopping':
          searchUrl = `https://www.google.com/search?q=${encodedQuery}&tbm=shop`;
          break;
        case 'scholar':
          searchUrl = `https://scholar.google.com/scholar?q=${encodedQuery}`;
          break;
        default:
          searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
      }

      const requestBody = {
        zone: serpZone,
        url: searchUrl,
        format: 'raw'
      };

      const response = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serpApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `BrightData SERP API error (${response.status}): ${errorText}`
        };
      }

      const htmlResult = await response.text();
      
      // Extract body content only
      const bodyContent = extractBodyContent(htmlResult);
      
      // Process with OpenAI using structured output
      const processedContent = await processWithOpenAI(bodyContent, 'search', query);

      return {
        success: true,
        action: "search",
        query,
        search_type,
        results: processedContent
      };

    } else if (action === 'fetch') { // If we are fetching a webpage
      if (!unlockerApiKey) {
        return {
          success: false,
          error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.'
        };
      }
      if (!url) {
        return {
          success: false,
          error: 'URL is required for fetch action.'
        };
      }

      // Validate the URL
      try {
        new URL(url);
      } catch (_) {
        return {
          success: false,
          error: 'Invalid URL provided.'
        };
      }

      const requestBody = {
        zone: unlockerZone,
        url: url,
        format: 'raw'
      };

      const response = await fetch('https://api.brightdata.com/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${unlockerApiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `BrightData Web Unlocker API error (${response.status}): ${errorText}`
        };
      }

      const htmlResult = await response.text();
      
      // Extract body content only
      const bodyContent = extractBodyContent(htmlResult);
      
      // Process with OpenAI using structured output
      const processedContent = await processWithOpenAI(bodyContent, 'fetch', '', url);

      return {
        success: true,
        action: "fetch",
        url,
        content: processedContent
      };

    } else {
      return {
        success: false,
        error: 'Invalid action. Must be either "search" or "fetch".'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}
