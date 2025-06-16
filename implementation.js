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

    // Google GL (country) parameter options
    const GOOGLE_GL_OPTIONS = [
      "af", "al", "dz", "as", "ad", "ao", "ai", "aq", "ag", "ar", "am", "aw", "au", "at", "az", 
      "bs", "bh", "bd", "bb", "by", "be", "bz", "bj", "bm", "bt", "bo", "ba", "bw", "bv", "br", 
      "io", "bn", "bg", "bf", "bi", "kh", "cm", "ca", "cv", "ky", "cf", "td", "cl", "cn", "cx", 
      "cc", "co", "km", "cg", "cd", "ck", "cr", "ci", "hr", "cu", "cy", "cz", "dk", "dj", "dm", 
      "do", "ec", "eg", "sv", "gq", "er", "ee", "et", "fk", "fo", "fj", "fi", "fr", "gf", "pf", 
      "tf", "ga", "gm", "ge", "de", "gh", "gi", "gr", "gl", "gd", "gp", "gu", "gt", "gn", "gw", 
      "gy", "ht", "hm", "va", "hn", "hk", "hu", "is", "in", "id", "ir", "iq", "ie", "il", "it", 
      "jm", "jp", "jo", "kz", "ke", "ki", "kp", "kr", "kw", "kg", "la", "lv", "lb", "ls", "lr", 
      "ly", "li", "lt", "lu", "mo", "mk", "mg", "mw", "my", "mv", "ml", "mt", "mh", "mq", "mr", 
      "mu", "yt", "mx", "fm", "md", "mc", "mn", "ms", "ma", "mz", "mm", "na", "nr", "np", "nl", 
      "nc", "nz", "ni", "ne", "ng", "nu", "nf", "mp", "no", "om", "pk", "pw", "ps", "pa", "pg", 
      "py", "pe", "ph", "pn", "pl", "pt", "pr", "qa", "re", "ro", "ru", "rw", "sh", "kn", "lc", 
      "pm", "vc", "ws", "sm", "st", "sa", "sn", "rs", "sc", "sl", "sg", "sk", "si", "sb", "so", 
      "za", "gs", "es", "lk", "sd", "sr", "sj", "sz", "se", "ch", "sy", "tw", "tj", "tz", "th", 
      "tl", "tg", "tk", "to", "tt", "tn", "tr", "tm", "tc", "tv", "ug", "ua", "ae", "uk", "gb", 
      "us", "um", "uy", "uz", "vu", "ve", "vn", "vg", "vi", "wf", "eh", "ye", "zm", "zw", "gg", 
      "je", "im", "me"
    ];

    // Google HL (language) parameter options  
    const GOOGLE_HL_OPTIONS = [
      "af", "ak", "sq", "am", "ar", "hy", "az", "eu", "be", "bem", "bn", "bh", "bs", "br", "bg", 
      "km", "ca", "chr", "ny", "zh-cn", "zh-tw", "co", "hr", "cs", "da", "nl", "en", "eo", "et", 
      "ee", "fo", "tl", "fi", "fr", "fy", "gaa", "gl", "ka", "de", "el", "kl", "gn", "gu", "ht", 
      "ha", "haw", "iw", "hi", "hu", "is", "ig", "id", "ia", "ga", "it", "ja", "jw", "kn", "kk", 
      "rw", "rn", "kg", "ko", "kri", "ku", "ckb", "ky", "lo", "la", "lv", "ln", "lt", "loz", "lg", 
      "ach", "mk", "mg", "my", "ms", "ml", "mt", "mv", "mi", "mr", "mfe", "mo", "mn", "sr-me", "ne", 
      "pcm", "nso", "no", "nn", "oc", "or", "om", "ps", "fa", "pl", "pt", "pt-br", "pt-pt", "pa", 
      "qu", "ro", "rm", "nyn", "ru", "gd", "sr", "sh", "st", "tn", "crs", "sn", "sd", "si", "sk", 
      "sl", "so", "es", "es-419", "su", "sw", "sv", "tg", "ta", "tt", "te", "th", "ti", "to", "lua", 
      "tum", "tr", "tk", "tw", "ug", "uk", "ur", "uz", "vu", "vi", "cy", "wo", "xh", "yi", "yo", "zu"
    ];

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

    // Helper function to detect content type and determine processing method
    function getContentProcessingType(content, contentType = '', url = '') {
      const contentTypeLower = contentType.toLowerCase();
      const urlLower = url.toLowerCase();

      // Check content type header first
      if (contentTypeLower.includes('text/html') || contentTypeLower.includes('application/xhtml')) {
        return 'html';
      }
      if (contentTypeLower.includes('application/json') || contentTypeLower.includes('text/json')) {
        return 'json';
      }
      if (contentTypeLower.includes('application/xml') || contentTypeLower.includes('text/xml')) {
        return 'xml';
      }
      if (contentTypeLower.includes('application/javascript') || contentTypeLower.includes('text/javascript')) {
        return 'javascript';
      }
      if (contentTypeLower.includes('text/css')) {
        return 'css';
      }
      if (contentTypeLower.includes('text/plain')) {
        return 'text';
      }

      // Check URL extension as fallback
      if (urlLower.endsWith('.json')) {
        return 'json';
      }
      if (urlLower.endsWith('.xml') || urlLower.endsWith('.rss') || urlLower.endsWith('.atom')) {
        return 'xml';
      }
      if (urlLower.endsWith('.js') || urlLower.endsWith('.mjs')) {
        return 'javascript';
      }
      if (urlLower.endsWith('.css')) {
        return 'css';
      }
      if (urlLower.endsWith('.txt')) {
        return 'text';
      }

      // Check content patterns as last resort
      if (isHtmlContent(content)) {
        return 'html';
      }

      // Try to parse as JSON
      try {
        JSON.parse(content);
        return 'json';
      } catch (e) {
        // Not JSON, continue
      }

      // Check for XML patterns
      if (content.trim().startsWith('<?xml') || content.trim().startsWith('<')) {
        return 'xml';
      }

      // If we get here, it's not one of our supported types
      return 'unsupported';
    }

    // Helper function to build Google search URL with parameters
    function buildGoogleSearchUrl(query, searchParams) {
      const baseUrl = 'https://www.google.com/search';
      const params = new URLSearchParams();
      
      // Add the main query
      params.append('q', query);
      
      // Add search type parameters
      if (searchParams.tbm) {
        params.append('tbm', searchParams.tbm);
      }
      
      if (searchParams.ibp) {
        params.append('ibp', searchParams.ibp);
      }
      
      // Add localization parameters
      if (searchParams.gl) {
        params.append('gl', searchParams.gl);
      }
      
      if (searchParams.hl) {
        params.append('hl', searchParams.hl);
      }
      
      // Add pagination parameters
      if (searchParams.start !== undefined) {
        params.append('start', searchParams.start.toString());
      }
      
      if (searchParams.num !== undefined) {
        params.append('num', searchParams.num.toString());
      }
      
      return `${baseUrl}?${params.toString()}`;
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

    // JSON schema for content
    const contentSchema = {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "properties": {
            "title": {
              "type": ["string", "null"],
              "description": "Main content headline or title"
            },
            "content": {
              "type": ["string", "null"],
              "description": "Clean text content of the main body without HTML tags, line breaks, or non-essential information"
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

IMPORTANT: Respond in the same language as the user's query. If content is in other languages, translate titles and excerpts to match the user's language while preserving important original terms in parentheses when relevant.

REFERENCE: Available Google search parameters for future use:
- gl (country localization): ${GOOGLE_GL_OPTIONS.join(', ')}
- hl (interface language): ${GOOGLE_HL_OPTIONS.join(', ')}

Find all search results and extract exactly what you see:
- source_name: The source name acronym, name, or domain name (e.g., CNN, BBC, Microsoft, "wikipedia.org", "example.com")
- title: The clickable title/headline (translate to user's language if needed, show original key terms in parentheses if relevant)
- excerpt: The description or snippet text (translate to user's language if needed)
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
        prompt = `Extract the main content from the HTML and respond in the same language as the user would expect (default to English if unclear).

1. Identify and extract ONLY the main content body as clean text.
2. Remove all navigation, ads, sidebars, suggested content, copyright notices, social media buttons, comments, suggestions for following, subscribing or reading more about different topics, footers, content unrelated to the main content, or any non-essential information.
3. Preserve <pre>, <code> HTML tags, but remove all other HTML tags and links to return plain text.
4. Remove all line breaks such as \\n or \\r\\n.
5. Focus only on the core readable content that a user would want to read.
6. If content is in a different language than expected, translate to the user's expected language while preserving important original terms in parentheses when relevant.
7. Generate a targeted research query (2-10 words) based on the main topic that would help find additional information about this content.

HTML Content:
${content}`;
        responseFormat = {
          type: "json_schema",
          json_schema: {
            name: "content",
            strict: true,
            schema: contentSchema
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

    // If we are performing a search action using BrightData SERP API
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

      // Build search URL with provided parameters
      const searchParams = {
        tbm,
        ibp,
        gl,
        hl,
        start,
        num
      };

      const searchUrl = buildGoogleSearchUrl(query, searchParams);

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
        search_params: searchParams,
        search_url: searchUrl,
        results: processedContent
      };

    } else if (action === 'fetch') { // If we are fetching a webpage using BrightData Web Unlocker API
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
      const contentType = response.headers.get('content-type') || '';
      
      // Determine how to process the content
      const processingType = getContentProcessingType(rawContent, contentType, url);

      switch (processingType) {
        case 'html':
          // Extract body content and process with OpenAI
          const bodyContent = extractBodyContent(rawContent);
          const processedContent = await processWithOpenAI(bodyContent, 'fetch', '', url);
          
          return {
            success: true,
            action: "fetch",
            url,
            content: processedContent,
            content_type: "html"
          };

        case 'json':
        case 'xml':
        case 'javascript':
        case 'css':
        case 'text':
          // Return content as-is without AI processing
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
            content_type: processingType
          };

        case 'unsupported':
          return {
            success: false,
            error: `Unsupported content type: ${contentType}. This plugin only supports HTML, JSON, XML, JavaScript, CSS, and plain text files. For images, videos, PDFs, and other binary files, please upload them directly to the chat.`
          };

        default:
          // Fallback - treat as text
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
            content_type: "text"
          };
      }

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
