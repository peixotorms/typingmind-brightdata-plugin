async function brightdata_web_fetcher(params, userSettings) {
  try {
    const { action, query, search_type = 'web', url } = params;
    const {
      serpApiKey,
      serpZone = 'serp_api1_web_search',
      unlockerApiKey,
      unlockerZone = 'web_unlocker1',
      autoEnabled = 'true'
    } = userSettings;

    if (autoEnabled !== 'true') {
      return {
        success: false,
        error: 'Automatic web fetching is disabled in plugin settings.'
      };
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

      // Return the result as raw HTML
      const htmlResult = await response.text();
      return {
        success: true,
        action: "search",
        query,
        search_type,
        result: htmlResult
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

      // Return the content as raw HTML
      const htmlResult = await response.text();
      return {
        success: true,
        action: "fetch",
        url,
        result: htmlResult
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
