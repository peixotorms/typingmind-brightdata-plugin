/**
 * Perform a Google search via BrightData SERP API.
 */
async function search_web(params, userSettings) {
  try {
    const { query, search_type = 'web' } = params;
    const { serpApiKey, serpZone = 'serp_api1_web_search', autoEnabled = 'true' } = userSettings;

    if (!serpApiKey) {
      throw new Error('BrightData SERP API key not configured.');
    }
    if (autoEnabled !== 'true') {
      throw new Error('Automatic web fetching is disabled.');
    }

    const encode = encodeURIComponent;
    const urlMap = {
      web:    `https://www.google.com/search?q=${encode(query)}`,
      news:   `https://www.google.com/search?q=${encode(query)}&tbm=nws`,
      images: `https://www.google.com/search?q=${encode(query)}&tbm=isch`,
      videos: `https://www.google.com/search?q=${encode(query)}&tbm=vid`,
      shopping:`https://www.google.com/search?q=${encode(query)}&tbm=shop`,
      scholar:`https://scholar.google.com/scholar?q=${encode(query)}`
    };
    const targetUrl = urlMap[search_type] || urlMap.web;

    const body = JSON.stringify({ zone: serpZone, url: targetUrl, format: 'raw' });
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serpApiKey}`
      },
      body
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`BrightData SERP API error (${res.status}): ${err}`);
    }
    const text = await res.text();
    return `Search results for "${query}" (${search_type}):\n\n${text}`;
  } catch (e) {
    throw new Error(`search_web failed: ${e.message}`);
  }
}

/**
 * Fetch a single webpage via BrightData Web Unlocker API.
 */
async function fetch_webpage(params, userSettings) {
  try {
    const { url } = params;
    const { unlockerApiKey, unlockerZone = 'web_unlocker1', autoEnabled = 'true' } = userSettings;

    if (!unlockerApiKey) {
      throw new Error('BrightData Web Unlocker API key not configured.');
    }
    if (autoEnabled !== 'true') {
      throw new Error('Automatic web fetching is disabled.');
    }

    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL provided.');
    }

    const body = JSON.stringify({ zone: unlockerZone, url, format: 'raw' });
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${unlockerApiKey}`
      },
      body
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`BrightData Unlocker API error (${res.status}): ${err}`);
    }
    const text = await res.text();
    return `Content from ${url}:\n\n${text}`;
  } catch (e) {
    throw new Error(`fetch_webpage failed: ${e.message}`);
  }
}
