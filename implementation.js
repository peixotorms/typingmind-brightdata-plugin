async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { 
      action, 
      query, 
      context_question,
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

    // Separate limits for searches and URL fetches
    const MAX_SEARCH_QUERIES = 15;
    const MAX_FETCH_URLS = 150;

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

    // Query analysis schema for AI parameter suggestions
    const queryAnalysisSchema = {
      "type": "object",
      "properties": {
        "suggested_gl": { "type": ["string", "null"], "description": "Suggested Google gl (country) parameter" },
        "suggested_hl": { "type": ["string", "null"], "description": "Suggested Google hl (language) parameter" },
        "additional_queries": { 
          "type": "array", 
          "items": { "type": "string" },
          "maxItems": 10,
          "description": "Additional related queries for comprehensive results" 
        },
        "reasoning": { "type": "string", "description": "Brief explanation of parameter choices" }
      },
      "required": ["suggested_gl", "suggested_hl", "additional_queries", "reasoning"],
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

    // PARALLEL: Analyze multiple queries for optimal parameters with context
    async function analyzeQueriesForParameters(queries, contextQuestion) {
      if (!openaiApiKey || !queries.length) return [];
      
      const analysisPromises = queries.map(async (query, index) => {
        const prompt = `Analyze this search query and determine the best Google search parameters and additional queries:

Original Context/Question: "${contextQuestion || 'General search'}"
Current Query: "${query}"

Available country codes (gl): ${GOOGLE_GL_OPTIONS.join(', ')}
Available language codes (hl): ${GOOGLE_HL_OPTIONS.join(', ')}

Instructions:
1. Detect geographic references and suggest appropriate gl parameter
2. Detect language context and suggest appropriate hl parameter  
3. Generate 3-10 additional related queries focused on the original context
4. If query mentions a specific country, prioritize that country's gl and primary language
5. Consider cultural/local context for better results
6. Keep additional queries relevant to the original question/context

Provide reasoning for your choices.`;

        const requestBody = {
          model: openaiModel,
          messages: [{ role: "user", content: prompt }],
          response_format: { 
            type: "json_schema", 
            json_schema: { 
              name: "query_analysis", 
              strict: true, 
              schema: queryAnalysisSchema 
            }
          },
          max_tokens: 1500,
          temperature: 0.2
        };

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) return { query, index, analysis: null };
          
          const result = await response.json();
          const content = result.choices[0]?.message?.content;
          if (!content) return { query, index, analysis: null };
          
          return { query, index, analysis: JSON.parse(content) };
        } catch (error) {
          return { query, index, analysis: null };
        }
      });

      return Promise.all(analysisPromises);
    }

    // Original content schema with arrays and optional name
    const contentSchema = {
      "type": "object",
      "properties": {
        "data": {
          "type": "object",
          "properties": {
            "name": { "type": ["string", "null"], "description": "Optional descriptive name/identifier for this content" },
            "title": { "type": ["string", "null"], "description": "Main content headline or title" },
            "content": { "type": ["string", "null"], "description": "Clean text content of the main body without HTML tags, line breaks, or non-essential information" },
            "keywords": { 
              "type": "array", 
              "items": { "type": "string" },
              "maxItems": 10,
              "description": "Array of relevant keywords and phrases extracted from the content" 
            },
            "research_queries": { 
              "type": "array", 
              "items": { "type": "string" },
              "maxItems": 5,
              "description": "Array of targeted research queries (2-10 words each) for finding related information" 
            }
          },
          "required": ["name", "title", "content", "keywords", "research_queries"],
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

    // PARALLEL: Batch OpenAI processing for multiple HTML contents
    async function batchProcessWithOpenAI(contentBatch, actionType, contextQuestion = '') {
      if (!openaiApiKey) throw new Error('OpenAI API key not configured. Please set it in plugin settings.');
      
      const requests = contentBatch.map(async (item) => {
        let prompt, responseFormat;
        
        if (actionType === 'search') {
          prompt = `Extract search results from this Google search HTML content for the query: "${item.query}". 
IMPORTANT: Respond in the same language as the user's query.
REFERENCE: Google search parameters options:
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
5. Generate a descriptive name for this content.
6. Extract 5-10 relevant keywords.
7. Generate 3-5 targeted research queries (2-10 words each) for finding related information.
URL: ${item.url}
HTML Content:
${item.content}`;
          responseFormat = { type: "json_schema", json_schema: { name: "content", strict: true, schema: contentSchema }};
        }

        const requestBody = {
          model: openaiModel,
          messages: [{ role: "user", content: prompt }],
          response_format: responseFormat,
          max_tokens: 32768,
          temperature: 0
        };

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) throw new Error(`OpenAI API error (${response.status}): ${await response.text()}`);
          
          const result = await response.json();
          const content_response = result.choices[0]?.message?.content;
          if (!content_response) throw new Error('No response generated from OpenAI');
          
          return { 
            ...item, 
            processed: JSON.parse(content_response),
            success: true 
          };
        } catch (error) {
          return { 
            ...item, 
            processed: null, 
            success: false, 
            error: error.message 
          };
        }
      });

      return Promise.all(requests);
    }

    // PARALLEL: Fetch multiple URLs with batch AI processing
    async function fetchMultipleUrls(urls, contextQuestion) {
      // Step 1: Fetch all URLs in parallel
      const fetchPromises = urls.map(async (url, index) => {
        try { 
          new URL(url); 
        } catch (_) {
          return { url, index, success: false, error: 'Invalid URL provided.' };
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
            return { url, index, success: false, error: `BrightData Web Unlocker API error (${response.status}): ${errorText}` };
          }
          
          const rawContent = await response.text();
          const contentType = response.headers.get('content-type') || '';
          const processingType = getContentProcessingType(rawContent, contentType, url);
          
          return {
            url,
            index,
            success: true,
            rawContent,
            contentType,
            processingType
          };
        } catch (error) {
          return { url, index, success: false, error: `Error fetching URL: ${error.message}` };
        }
      });

      const fetchResults = await Promise.all(fetchPromises);

      // Step 2: Separate HTML content for batch AI processing
      const htmlItems = [];
      const finalResults = [];

      fetchResults.forEach((result) => {
        if (!result.success) {
          finalResults[result.index] = result;
          return;
        }

        if (result.processingType === 'html') {
          const bodyContent = extractBodyContent(result.rawContent);
          htmlItems.push({
            url: result.url,
            index: result.index,
            content: bodyContent
          });
        } else if (['json', 'xml', 'javascript', 'css', 'text'].includes(result.processingType)) {
          finalResults[result.index] = {
            success: true,
            url: result.url,
            content: { 
              data: { 
                name: null, 
                title: null, 
                content: result.rawContent, 
                keywords: [], 
                research_queries: [] 
              } 
            },
            content_type: result.processingType
          };
        } else if (result.processingType === 'unsupported') {
          finalResults[result.index] = {
            success: false,
            url: result.url,
            error: `Unsupported content type: ${result.contentType}. This plugin only supports HTML, JSON, XML, JavaScript, CSS, and plain text files.`
          };
        } else {
          finalResults[result.index] = {
            success: true,
            url: result.url,
            content: { 
              data: { 
                name: null, 
                title: null, 
                content: result.rawContent, 
                keywords: [], 
                research_queries: [] 
              } 
            },
            content_type: "text"
          };
        }
      });

      // Step 3: Process HTML content in parallel batches
      if (htmlItems.length > 0) {
        const processedHtmlItems = await batchProcessWithOpenAI(htmlItems, 'fetch', contextQuestion);
        
        processedHtmlItems.forEach((item) => {
          if (item.success) {
            finalResults[item.index] = {
              success: true,
              url: item.url,
              content: item.processed,
              content_type: "html"
            };
          } else {
            finalResults[item.index] = {
              success: false,
              url: item.url,
              error: `Content processing error: ${item.error}`
            };
          }
        });
      }

      return finalResults.filter(Boolean); // Remove any undefined entries
    }

    // Main logic
    if (action === 'search') {
      if (!serpApiKey)
        return { success: false, error: 'BrightData SERP API key not configured. Please set it in plugin settings.' };
      if (!query)
        return { success: false, error: 'Query is required for search action.' };

      let queries = Array.isArray(query) ? query : [query];
      let searchParams = { tbm, ibp, gl, hl, start, num: num || 10 }; // Default to 10 results per query
      let queryAnalyses = [];

      // PARALLEL: Analyze all queries for optimal parameters if not provided
      if (!gl || !hl) {
        queryAnalyses = await analyzeQueriesForParameters(queries, context_question);
        
        // Apply AI suggestions from first successful analysis if user didn't specify parameters
        const firstValidAnalysis = queryAnalyses.find(qa => qa.analysis);
        if (firstValidAnalysis && firstValidAnalysis.analysis) {
          if (!gl && firstValidAnalysis.analysis.suggested_gl && GOOGLE_GL_OPTIONS.includes(firstValidAnalysis.analysis.suggested_gl)) {
            searchParams.gl = firstValidAnalysis.analysis.suggested_gl;
          }
          if (!hl && firstValidAnalysis.analysis.suggested_hl && GOOGLE_HL_OPTIONS.includes(firstValidAnalysis.analysis.suggested_hl)) {
            searchParams.hl = firstValidAnalysis.analysis.suggested_hl;
          }
        }

        // Add additional queries from all analyses
        const additionalQueries = [];
        queryAnalyses.forEach(qa => {
          if (qa.analysis && qa.analysis.additional_queries) {
            additionalQueries.push(...qa.analysis.additional_queries);
          }
        });
        
        if (additionalQueries.length > 0) {
          queries = [...queries, ...additionalQueries];
        }
      }

      // Apply search query limit
      if (queries.length > MAX_SEARCH_QUERIES) {
        queries = queries.slice(0, MAX_SEARCH_QUERIES);
      }

      // PARALLEL: Execute all search requests
      const searchPromises = queries.map((q, index) => {
        const searchUrl = buildGoogleSearchUrl(q, searchParams);
        return fetch('https://api.brightdata.com/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serpApiKey}` },
          body: JSON.stringify({ zone: serpZone, url: searchUrl, format: 'raw' })
        })
          .then(async r => {
            if (!r.ok) {
              const errorText = await r.text();
              return { 
                query: q, 
                index, 
                success: false, 
                error: `BrightData SERP API error (${r.status}): ${errorText}` 
              };
            }
            const htmlResult = await r.text();
            const bodyContent = extractBodyContent(htmlResult);
            return {
              query: q,
              index,
              success: true,
              content: bodyContent
            };
          })
          .catch(error => ({ 
            query: q, 
            index, 
            success: false, 
            error: `Fetch error: ${error.message}` 
          }));
      });

      const searchResults = await Promise.all(searchPromises);

      // PARALLEL: Process all HTML search results with AI  
      const htmlSearchItems = searchResults
        .filter(result => result.success)
        .map(result => ({
          query: result.query,
          index: result.index,
          content: result.content
        }));

      const processedSearchResults = await batchProcessWithOpenAI(htmlSearchItems, 'search', context_question);

      // Combine results
      const finalSearchResults = searchResults.map(result => {
        if (!result.success) {
          return {
            success: false,
            query: result.query,
            query_index: result.index,
            error: result.error
          };
        }

        const processed = processedSearchResults.find(p => p.index === result.index);
        return {
          success: processed?.success || false,
          query: result.query,
          query_index: result.index,
          is_primary: result.index < (Array.isArray(query) ? query.length : 1),
          search_params: searchParams,
          results: processed?.processed || null,
          error: processed?.success ? undefined : processed?.error
        };
      });

      const response = {
        success: true,
        results: finalSearchResults,
        total_queries: queries.length,
        queries_limit_applied: queries.length >= MAX_SEARCH_QUERIES,
        search_params_used: searchParams,
        context_question: context_question
      };

      // Include AI analysis info if available
      if (queryAnalyses.length > 0) {
        response.ai_analyses = queryAnalyses.map(qa => ({
          query: qa.query,
          reasoning: qa.analysis?.reasoning,
          suggested_gl: qa.analysis?.suggested_gl,
          suggested_hl: qa.analysis?.suggested_hl,
          generated_additional_queries: qa.analysis?.additional_queries
        }));
      }

      return Array.isArray(query) ? response : finalSearchResults[0];

    } else if (action === 'fetch') {
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!url)
        return { success: false, error: 'URL is required for fetch action.' };

      const urls = Array.isArray(url) ? url : [url];
      
      // Apply URL fetch limit
      const limitedUrls = urls.length > MAX_FETCH_URLS ? urls.slice(0, MAX_FETCH_URLS) : urls;

      // PARALLEL: Fetch and process all URLs
      const results = await fetchMultipleUrls(limitedUrls, context_question);
      
      return Array.isArray(url) ? {
        success: true,
        results,
        total_urls: limitedUrls.length,
        urls_limit_applied: urls.length > MAX_FETCH_URLS,
        context_question: context_question
      } : results[0];

    } else {
      return { success: false, error: 'Invalid action. Must be either "search" or "fetch".' };
    }
  } catch (error) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
