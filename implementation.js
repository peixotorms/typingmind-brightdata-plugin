async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { action, query, search_type = 'web', url, image_format = 'auto' } = params;
    const {
      serpApiKey,
      serpZone,
      unlockerApiKey,
      unlockerZone,
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

    // Helper function to detect if content is HTML
    function isHtmlContent(content) {
      if (!content || typeof content !== 'string') {
        return false;
      }
      
      // Trim whitespace and convert to lowercase for checking
      const trimmedContent = content.trim().toLowerCase();
      
      // Check for common HTML patterns
      const htmlPatterns = [
        /^<!doctype\s+html/i,
        /^<html/i,
        /^<\?xml.*\?>/i,
        /<html[\s>]/i,
        /<head[\s>]/i,
        /<body[\s>]/i,
        /<title[\s>]/i,
        /<meta[\s>]/i,
        /<div[\s>]/i,
        /<p[\s>]/i,
        /<span[\s>]/i,
        /<article[\s>]/i,
        /<section[\s>]/i,
        /<header[\s>]/i,
        /<footer[\s>]/i,
        /<nav[\s>]/i,
        /<main[\s>]/i
      ];
      
      // Check if content matches any HTML pattern
      return htmlPatterns.some(pattern => pattern.test(trimmedContent));
    }

    // Helper function to detect image format from URL or content type
    function detectImageFormat(url, contentType = '') {
      const urlLower = url.toLowerCase();
      const contentTypeLower = contentType.toLowerCase();
      
      // Check content type first
      if (contentTypeLower.includes('image/jpeg') || contentTypeLower.includes('image/jpg')) {
        return 'jpeg';
      }
      if (contentTypeLower.includes('image/png')) {
        return 'png';
      }
      if (contentTypeLower.includes('image/webp')) {
        return 'webp';
      }
      if (contentTypeLower.includes('image/gif')) {
        return 'gif';
      }
      
      // Check URL extension
      if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) {
        return 'jpeg';
      }
      if (urlLower.includes('.png')) {
        return 'png';
      }
      if (urlLower.includes('.webp')) {
        return 'webp';
      }
      if (urlLower.includes('.gif')) {
        return 'gif';
      }
      
      // Default to jpeg if unable to determine
      return 'jpeg';
    }

    // Helper function to convert ArrayBuffer to base64
    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
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
        "data": {
          "type": "object",
          "properties": {
            "title": {
              "type": ["string", "null"],
              "description": "Main article headline"
            },
            "content": {
              "type": ["string", "null"],
              "description": "Clean text content of the main article body without HTML tags, line breaks, or non-essential information"
            },
            "target_research": {
              "type": ["string", "null"],
              "description": "Targeted research query (2-10 words) based on the main topic to find additional information"
            }
          },
          "required": ["title", "content", "target_research"],
          "additionalProperties": false
        }
      },
      "required": ["data"],
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
        prompt = `Extract the main content from the HTML:
1. Identify and extract ONLY the main article/content body as clean text.
2. Remove all navigation, ads, sidebars, suggested articles, copyright notices, social media buttons, comments, suggestions for following, subscribing or reading more about different topics, footers, content unrelated to the main content, or any non-essential information.
3. Preserve <pre>, <code> HTml tags, but remove all other HTML tags and links to return plain text.
4. Remove all line breaks such as \\n or \\r\\n.
5. Focus only on the core readable content that a user would want to read.
6. Generate a targeted research query (2-10 words) based on the main topic that would help find additional information about this story.

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
        max_tokens: 32768,
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

      const rawContent = await response.text();
      
      // Check if the content is HTML
      if (!isHtmlContent(rawContent)) {
        // Return raw content without processing for non-HTML content
        return {
          success: true,
          action: "fetch",
          url,
          content: {
            data: {
              title: null,
              content: rawContent,
              target_research: null
            }
          },
          content_type: "non-html"
        };
      }

      // For HTML content, continue with existing processing
      // Extract body content only
      const bodyContent = extractBodyContent(rawContent);
      
      // Process with OpenAI using structured output
      const processedContent = await processWithOpenAI(bodyContent, 'fetch', '', url);

      return {
        success: true,
        action: "fetch",
        url,
        content: processedContent,
        content_type: "html"
      };

    } else if (action === 'download_image') { // If we are downloading an image
      if (!unlockerApiKey) {
        return {
          success: false,
          error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.'
        };
      }
      if (!url) {
        return {
          success: false,
          error: 'URL is required for download_image action.'
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

      // First try direct fetch for images
      try {
        const directResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (directResponse.ok) {
          const contentType = directResponse.headers.get('content-type') || '';
          
          // Check if it's actually an image
          if (contentType.startsWith('image/')) {
            const imageBuffer = await directResponse.arrayBuffer();
            const base64Data = arrayBufferToBase64(imageBuffer);
            const detectedFormat = detectImageFormat(url, contentType);
            
            return {
              success: true,
              action: "download_image",
              url,
              image: {
                data: base64Data,
                format: detectedFormat,
                content_type: contentType,
                size_bytes: imageBuffer.byteLength,
                base64_url: `data:${contentType};base64,${base64Data}`
              },
              method: "direct_fetch"
            };
          }
        }
      } catch (directError) {
        // If direct fetch fails, continue with BrightData
        console.log('Direct fetch failed, trying BrightData:', directError.message);
      }

      // Fallback to BrightData if direct fetch fails
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

      // Get the response as ArrayBuffer for binary data
      const imageBuffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      // Convert to base64
      const base64Data = arrayBufferToBase64(imageBuffer);
      const detectedFormat = image_format === 'auto' ? detectImageFormat(url, contentType) : image_format;
      
      return {
        success: true,
        action: "download_image",
        url,
        image: {
          data: base64Data,
          format: detectedFormat,
          content_type: contentType,
          size_bytes: imageBuffer.byteLength,
          base64_url: `data:${contentType};base64,${base64Data}`
        },
        method: "brightdata"
      };

    } else {
      return {
        success: false,
        error: 'Invalid action. Must be either "search", "fetch", or "download_image".'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`
    };
  }
}
