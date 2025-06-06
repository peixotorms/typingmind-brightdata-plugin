async function brightdata_web_fetcher(params, userSettings) {
  const { action, query, search_type = 'web', url } = params;
  const {
    serpApiKey,
    serpZone = 'serp_api1_web_search',
    unlockerApiKey,
    unlockerZone = 'web_unlocker1',
    autoEnabled = 'true'
  } = userSettings;

  if (autoEnabled !== 'true') {
    throw new Error('Automatic web fetching is disabled in plugin settings.');
  }

  // If we are performing a search action
  if (action === 'search') {
    if (!serpApiKey) {
      throw new Error('BrightData SERP API key not configured. Please set it in plugin settings.');
    }
    if (!query) {
      throw new Error('Query is required for search action.');
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
      format: 'json'
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
      throw new Error(`BrightData SERP API error (${response.status}): ${errorText}`);
    }

    // Return the result parsed as JSON
    const jsonResult = await response.json();
    return {
      action: "search",
      query,
      search_type,
      result: jsonResult
    };

  } else if (action === 'fetch') { // If we are fetching a webpage
    if (!unlockerApiKey) {
      throw new Error('BrightData Web Unlocker API key not configured. Please set it in plugin settings.');
    }
    if (!url) {
      throw new Error('URL is required for fetch action.');
    }

    // Validate the URL
    try {
      new URL(url);
    } catch (_) {
      throw new Error('Invalid URL provided.');
    }

    const requestBody = {
      zone: unlockerZone,
      url: url,
      format: 'json'
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
      throw new Error(`BrightData Web Unlocker API error (${response.status}): ${errorText}`);
    }

    // Return the content as parsed JSON
    const jsonResult = await response.json();
    return {
      action: "fetch",
      url,
      result: jsonResult
    };

  } else {
    throw new Error('Invalid action. Must be either "search" or "fetch".');
  }
}
