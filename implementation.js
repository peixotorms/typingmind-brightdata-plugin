async function search_web(params, userSettings) {
  try {
    const { query, search_type = 'web' } = params;
    const { apiKey, serpZone = 'serp_api1_web_search', autoEnabled = 'true' } = userSettings;
    
    if (!apiKey) {
      throw new Error('BrightData API key not configured. Please set it in plugin settings.');
    }
    
    if (autoEnabled !== 'true') {
      throw new Error('Automatic web fetching is disabled in plugin settings.');
    }
    
    const searchTypes = {
      'web': 'https://www.google.com/search?q=',
      'news': 'https://www.google.com/search?q={query}&tbm=nws',
      'images': 'https://www.google.com/search?q={query}&tbm=isch',
      'videos': 'https://www.google.com/search?q={query}&tbm=vid',
      'shopping': 'https://www.google.com/search?q={query}&tbm=shop',
      'scholar': 'https://scholar.google.com/scholar?q='
    };
    
    if (!searchTypes[search_type]) {
      throw new Error(`Invalid search type. Available types: ${Object.keys(searchTypes).join(', ')}`);
    }
    
    const encodedQuery = encodeURIComponent(query);
    let searchUrl;
    
    switch(search_type) {
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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BrightData API error (${response.status}): ${errorText}`);
    }

    const result = await response.text();
    return `Search results for "${query}" (${search_type}):\n\n${result}`;
    
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

async function fetch_webpage(params, userSettings) {
  try {
    const { url } = params;
    const { apiKey, unlockerZone = 'web_unlocker1', autoEnabled = 'true' } = userSettings;
    
    if (!apiKey) {
      throw new Error('BrightData API key not configured. Please set it in plugin settings.');
    }
    
    if (autoEnabled !== 'true') {
      throw new Error('Automatic web fetching is disabled in plugin settings.');
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch (_) {
      throw new Error('Invalid URL provided');
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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`BrightData API error (${response.status}): ${errorText}`);
    }

    const result = await response.text();
    return `Content from ${url}:\n\n${result}`;
    
  } catch (error) {
    throw new Error(`Webpage fetch failed: ${error.message}`);
  }
}
