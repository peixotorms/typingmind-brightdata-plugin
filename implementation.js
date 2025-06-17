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
      url,
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

    // Google country codes from provided JSON
    const GOOGLE_COUNTRIES = [
      {"country_code": "af", "country_name": "Afghanistan"}, {"country_code": "al", "country_name": "Albania"}, {"country_code": "dz", "country_name": "Algeria"}, {"country_code": "as", "country_name": "American Samoa"}, {"country_code": "ad", "country_name": "Andorra"}, {"country_code": "ao", "country_name": "Angola"}, {"country_code": "ai", "country_name": "Anguilla"}, {"country_code": "aq", "country_name": "Antarctica"}, {"country_code": "ag", "country_name": "Antigua and Barbuda"}, {"country_code": "ar", "country_name": "Argentina"}, {"country_code": "am", "country_name": "Armenia"}, {"country_code": "aw", "country_name": "Aruba"}, {"country_code": "au", "country_name": "Australia"}, {"country_code": "at", "country_name": "Austria"}, {"country_code": "az", "country_name": "Azerbaijan"}, {"country_code": "bs", "country_name": "Bahamas"}, {"country_code": "bh", "country_name": "Bahrain"}, {"country_code": "bd", "country_name": "Bangladesh"}, {"country_code": "bb", "country_name": "Barbados"}, {"country_code": "by", "country_name": "Belarus"}, {"country_code": "be", "country_name": "Belgium"}, {"country_code": "bz", "country_name": "Belize"}, {"country_code": "bj", "country_name": "Benin"}, {"country_code": "bm", "country_name": "Bermuda"}, {"country_code": "bt", "country_name": "Bhutan"}, {"country_code": "bo", "country_name": "Bolivia"}, {"country_code": "ba", "country_name": "Bosnia and Herzegovina"}, {"country_code": "bw", "country_name": "Botswana"}, {"country_code": "bv", "country_name": "Bouvet Island"}, {"country_code": "br", "country_name": "Brazil"}, {"country_code": "io", "country_name": "British Indian Ocean Territory"}, {"country_code": "bn", "country_name": "Brunei Darussalam"}, {"country_code": "bg", "country_name": "Bulgaria"}, {"country_code": "bf", "country_name": "Burkina Faso"}, {"country_code": "bi", "country_name": "Burundi"}, {"country_code": "kh", "country_name": "Cambodia"}, {"country_code": "cm", "country_name": "Cameroon"}, {"country_code": "ca", "country_name": "Canada"}, {"country_code": "cv", "country_name": "Cape Verde"}, {"country_code": "ky", "country_name": "Cayman Islands"}, {"country_code": "cf", "country_name": "Central African Republic"}, {"country_code": "td", "country_name": "Chad"}, {"country_code": "cl", "country_name": "Chile"}, {"country_code": "cn", "country_name": "China"}, {"country_code": "cx", "country_name": "Christmas Island"}, {"country_code": "cc", "country_name": "Cocos (Keeling) Islands"}, {"country_code": "co", "country_name": "Colombia"}, {"country_code": "km", "country_name": "Comoros"}, {"country_code": "cg", "country_name": "Congo"}, {"country_code": "cd", "country_name": "Congo, the Democratic Republic of the"}, {"country_code": "ck", "country_name": "Cook Islands"}, {"country_code": "cr", "country_name": "Costa Rica"}, {"country_code": "ci", "country_name": "Cote D'ivoire"}, {"country_code": "hr", "country_name": "Croatia"}, {"country_code": "cu", "country_name": "Cuba"}, {"country_code": "cy", "country_name": "Cyprus"}, {"country_code": "cz", "country_name": "Czech Republic"}, {"country_code": "dk", "country_name": "Denmark"}, {"country_code": "dj", "country_name": "Djibouti"}, {"country_code": "dm", "country_name": "Dominica"}, {"country_code": "do", "country_name": "Dominican Republic"}, {"country_code": "ec", "country_name": "Ecuador"}, {"country_code": "eg", "country_name": "Egypt"}, {"country_code": "sv", "country_name": "El Salvador"}, {"country_code": "gq", "country_name": "Equatorial Guinea"}, {"country_code": "er", "country_name": "Eritrea"}, {"country_code": "ee", "country_name": "Estonia"}, {"country_code": "et", "country_name": "Ethiopia"}, {"country_code": "fk", "country_name": "Falkland Islands (Malvinas)"}, {"country_code": "fo", "country_name": "Faroe Islands"}, {"country_code": "fj", "country_name": "Fiji"}, {"country_code": "fi", "country_name": "Finland"}, {"country_code": "fr", "country_name": "France"}, {"country_code": "gf", "country_name": "French Guiana"}, {"country_code": "pf", "country_name": "French Polynesia"}, {"country_code": "tf", "country_name": "French Southern Territories"}, {"country_code": "ga", "country_name": "Gabon"}, {"country_code": "gm", "country_name": "Gambia"}, {"country_code": "ge", "country_name": "Georgia"}, {"country_code": "de", "country_name": "Germany"}, {"country_code": "gh", "country_name": "Ghana"}, {"country_code": "gi", "country_name": "Gibraltar"}, {"country_code": "gr", "country_name": "Greece"}, {"country_code": "gl", "country_name": "Greenland"}, {"country_code": "gd", "country_name": "Grenada"}, {"country_code": "gp", "country_name": "Guadeloupe"}, {"country_code": "gu", "country_name": "Guam"}, {"country_code": "gt", "country_name": "Guatemala"}, {"country_code": "gn", "country_name": "Guinea"}, {"country_code": "gw", "country_name": "Guinea-Bissau"}, {"country_code": "gy", "country_name": "Guyana"}, {"country_code": "ht", "country_name": "Haiti"}, {"country_code": "hm", "country_name": "Heard Island and Mcdonald Islands"}, {"country_code": "va", "country_name": "Holy See (Vatican City State)"}, {"country_code": "hn", "country_name": "Honduras"}, {"country_code": "hk", "country_name": "Hong Kong"}, {"country_code": "hu", "country_name": "Hungary"}, {"country_code": "is", "country_name": "Iceland"}, {"country_code": "in", "country_name": "India"}, {"country_code": "id", "country_name": "Indonesia"}, {"country_code": "ir", "country_name": "Iran, Islamic Republic of"}, {"country_code": "iq", "country_name": "Iraq"}, {"country_code": "ie", "country_name": "Ireland"}, {"country_code": "il", "country_name": "Israel"}, {"country_code": "it", "country_name": "Italy"}, {"country_code": "jm", "country_name": "Jamaica"}, {"country_code": "jp", "country_name": "Japan"}, {"country_code": "jo", "country_name": "Jordan"}, {"country_code": "kz", "country_name": "Kazakhstan"}, {"country_code": "ke", "country_name": "Kenya"}, {"country_code": "ki", "country_name": "Kiribati"}, {"country_code": "kp", "country_name": "North Korea"}, {"country_code": "kr", "country_name": "South Korea"}, {"country_code": "kw", "country_name": "Kuwait"}, {"country_code": "kg", "country_name": "Kyrgyzstan"}, {"country_code": "la", "country_name": "Lao People's Democratic Republic"}, {"country_code": "lv", "country_name": "Latvia"}, {"country_code": "lb", "country_name": "Lebanon"}, {"country_code": "ls", "country_name": "Lesotho"}, {"country_code": "lr", "country_name": "Liberia"}, {"country_code": "ly", "country_name": "Libya"}, {"country_code": "li", "country_name": "Liechtenstein"}, {"country_code": "lt", "country_name": "Lithuania"}, {"country_code": "lu", "country_name": "Luxembourg"}, {"country_code": "mo", "country_name": "Macao"}, {"country_code": "mk", "country_name": "North Macedonia"}, {"country_code": "mg", "country_name": "Madagascar"}, {"country_code": "mw", "country_name": "Malawi"}, {"country_code": "my", "country_name": "Malaysia"}, {"country_code": "mv", "country_name": "Maldives"}, {"country_code": "ml", "country_name": "Mali"}, {"country_code": "mt", "country_name": "Malta"}, {"country_code": "mh", "country_name": "Marshall Islands"}, {"country_code": "mq", "country_name": "Martinique"}, {"country_code": "mr", "country_name": "Mauritania"}, {"country_code": "mu", "country_name": "Mauritius"}, {"country_code": "yt", "country_name": "Mayotte"}, {"country_code": "mx", "country_name": "Mexico"}, {"country_code": "fm", "country_name": "Micronesia, Federated States of"}, {"country_code": "md", "country_name": "Moldova, Republic of"}, {"country_code": "mc", "country_name": "Monaco"}, {"country_code": "mn", "country_name": "Mongolia"}, {"country_code": "ms", "country_name": "Montserrat"}, {"country_code": "ma", "country_name": "Morocco"}, {"country_code": "mz", "country_name": "Mozambique"}, {"country_code": "mm", "country_name": "Myanmar"}, {"country_code": "na", "country_name": "Namibia"}, {"country_code": "nr", "country_name": "Nauru"}, {"country_code": "np", "country_name": "Nepal"}, {"country_code": "nl", "country_name": "Netherlands"}, {"country_code": "nc", "country_name": "New Caledonia"}, {"country_code": "nz", "country_name": "New Zealand"}, {"country_code": "ni", "country_name": "Nicaragua"}, {"country_code": "ne", "country_name": "Niger"}, {"country_code": "ng", "country_name": "Nigeria"}, {"country_code": "nu", "country_name": "Niue"}, {"country_code": "nf", "country_name": "Norfolk Island"}, {"country_code": "mp", "country_name": "Northern Mariana Islands"}, {"country_code": "no", "country_name": "Norway"}, {"country_code": "om", "country_name": "Oman"}, {"country_code": "pk", "country_name": "Pakistan"}, {"country_code": "pw", "country_name": "Palau"}, {"country_code": "ps", "country_name": "Palestinian Territory, Occupied"}, {"country_code": "pa", "country_name": "Panama"}, {"country_code": "pg", "country_name": "Papua New Guinea"}, {"country_code": "py", "country_name": "Paraguay"}, {"country_code": "pe", "country_name": "Peru"}, {"country_code": "ph", "country_name": "Philippines"}, {"country_code": "pn", "country_name": "Pitcairn"}, {"country_code": "pl", "country_name": "Poland"}, {"country_code": "pt", "country_name": "Portugal"}, {"country_code": "pr", "country_name": "Puerto Rico"}, {"country_code": "qa", "country_name": "Qatar"}, {"country_code": "re", "country_name": "Reunion"}, {"country_code": "ro", "country_name": "Romania"}, {"country_code": "ru", "country_name": "Russian Federation"}, {"country_code": "rw", "country_name": "Rwanda"}, {"country_code": "sh", "country_name": "Saint Helena"}, {"country_code": "kn", "country_name": "Saint Kitts and Nevis"}, {"country_code": "lc", "country_name": "Saint Lucia"}, {"country_code": "pm", "country_name": "Saint Pierre and Miquelon"}, {"country_code": "vc", "country_name": "Saint Vincent and the Grenadines"}, {"country_code": "ws", "country_name": "Samoa"}, {"country_code": "sm", "country_name": "San Marino"}, {"country_code": "st", "country_name": "Sao Tome and Principe"}, {"country_code": "sa", "country_name": "Saudi Arabia"}, {"country_code": "sn", "country_name": "Senegal"}, {"country_code": "rs", "country_name": "Serbia and Montenegro"}, {"country_code": "sc", "country_name": "Seychelles"}, {"country_code": "sl", "country_name": "Sierra Leone"}, {"country_code": "sg", "country_name": "Singapore"}, {"country_code": "sk", "country_name": "Slovakia"}, {"country_code": "si", "country_name": "Slovenia"}, {"country_code": "sb", "country_name": "Solomon Islands"}, {"country_code": "so", "country_name": "Somalia"}, {"country_code": "za", "country_name": "South Africa"}, {"country_code": "gs", "country_name": "South Georgia and the South Sandwich Islands"}, {"country_code": "es", "country_name": "Spain"}, {"country_code": "lk", "country_name": "Sri Lanka"}, {"country_code": "sd", "country_name": "Sudan"}, {"country_code": "sr", "country_name": "Suriname"}, {"country_code": "sj", "country_name": "Svalbard and Jan Mayen"}, {"country_code": "sz", "country_name": "Swaziland"}, {"country_code": "se", "country_name": "Sweden"}, {"country_code": "ch", "country_name": "Switzerland"}, {"country_code": "sy", "country_name": "Syrian Arab Republic"}, {"country_code": "tw", "country_name": "Taiwan"}, {"country_code": "tj", "country_name": "Tajikistan"}, {"country_code": "tz", "country_name": "Tanzania, United Republic of"}, {"country_code": "th", "country_name": "Thailand"}, {"country_code": "tl", "country_name": "Timor-Leste"}, {"country_code": "tg", "country_name": "Togo"}, {"country_code": "tk", "country_name": "Tokelau"}, {"country_code": "to", "country_name": "Tonga"}, {"country_code": "tt", "country_name": "Trinidad and Tobago"}, {"country_code": "tn", "country_name": "Tunisia"}, {"country_code": "tr", "country_name": "Turkey"}, {"country_code": "tm", "country_name": "Turkmenistan"}, {"country_code": "tc", "country_name": "Turks and Caicos Islands"}, {"country_code": "tv", "country_name": "Tuvalu"}, {"country_code": "ug", "country_name": "Uganda"}, {"country_code": "ua", "country_name": "Ukraine"}, {"country_code": "ae", "country_name": "United Arab Emirates"}, {"country_code": "uk", "country_name": "United Kingdom"}, {"country_code": "gb", "country_name": "United Kingdom"}, {"country_code": "us", "country_name": "United States"}, {"country_code": "um", "country_name": "United States Minor Outlying Islands"}, {"country_code": "uy", "country_name": "Uruguay"}, {"country_code": "uz", "country_name": "Uzbekistan"}, {"country_code": "vu", "country_name": "Vanuatu"}, {"country_code": "ve", "country_name": "Venezuela"}, {"country_code": "vn", "country_name": "Viet Nam"}, {"country_code": "vg", "country_name": "Virgin Islands, British"}, {"country_code": "vi", "country_name": "Virgin Islands, U.S."}, {"country_code": "wf", "country_name": "Wallis and Futuna"}, {"country_code": "eh", "country_name": "Western Sahara"}, {"country_code": "ye", "country_name": "Yemen"}, {"country_code": "zm", "country_name": "Zambia"}, {"country_code": "zw", "country_name": "Zimbabwe"}, {"country_code": "gg", "country_name": "Guernsey"}, {"country_code": "je", "country_name": "Jersey"}, {"country_code": "im", "country_name": "Isle of Man"}, {"country_code": "me", "country_name": "Montenegro"}
    ];

    // Google language codes from provided JSON
    const GOOGLE_LANGUAGES = [
      {"language_code": "af", "language_name": "Afrikaans"}, {"language_code": "ak", "language_name": "Akan"}, {"language_code": "sq", "language_name": "Albanian"}, {"language_code": "am", "language_name": "Amharic"}, {"language_code": "ar", "language_name": "Arabic"}, {"language_code": "hy", "language_name": "Armenian"}, {"language_code": "az", "language_name": "Azerbaijani"}, {"language_code": "eu", "language_name": "Basque"}, {"language_code": "be", "language_name": "Belarusian"}, {"language_code": "bem", "language_name": "Bemba"}, {"language_code": "bn", "language_name": "Bengali"}, {"language_code": "bh", "language_name": "Bihari"}, {"language_code": "bs", "language_name": "Bosnian"}, {"language_code": "br", "language_name": "Breton"}, {"language_code": "bg", "language_name": "Bulgarian"}, {"language_code": "km", "language_name": "Cambodian"}, {"language_code": "ca", "language_name": "Catalan"}, {"language_code": "chr", "language_name": "Cherokee"}, {"language_code": "ny", "language_name": "Chichewa"}, {"language_code": "zh-cn", "language_name": "Chinese (Simplified)"}, {"language_code": "zh-tw", "language_name": "Chinese (Traditional)"}, {"language_code": "co", "language_name": "Corsican"}, {"language_code": "hr", "language_name": "Croatian"}, {"language_code": "cs", "language_name": "Czech"}, {"language_code": "da", "language_name": "Danish"}, {"language_code": "nl", "language_name": "Dutch"}, {"language_code": "en", "language_name": "English"}, {"language_code": "eo", "language_name": "Esperanto"}, {"language_code": "et", "language_name": "Estonian"}, {"language_code": "ee", "language_name": "Ewe"}, {"language_code": "fo", "language_name": "Faroese"}, {"language_code": "tl", "language_name": "Filipino"}, {"language_code": "fi", "language_name": "Finnish"}, {"language_code": "fr", "language_name": "French"}, {"language_code": "fy", "language_name": "Frisian"}, {"language_code": "gaa", "language_name": "Ga"}, {"language_code": "gl", "language_name": "Galician"}, {"language_code": "ka", "language_name": "Georgian"}, {"language_code": "de", "language_name": "German"}, {"language_code": "el", "language_name": "Greek"}, {"language_code": "kl", "language_name": "Greenlandic"}, {"language_code": "gn", "language_name": "Guarani"}, {"language_code": "gu", "language_name": "Gujarati"}, {"language_code": "ht", "language_name": "Haitian Creole"}, {"language_code": "ha", "language_name": "Hausa"}, {"language_code": "haw", "language_name": "Hawaiian"}, {"language_code": "iw", "language_name": "Hebrew"}, {"language_code": "hi", "language_name": "Hindi"}, {"language_code": "hu", "language_name": "Hungarian"}, {"language_code": "is", "language_name": "Icelandic"}, {"language_code": "ig", "language_name": "Igbo"}, {"language_code": "id", "language_name": "Indonesian"}, {"language_code": "ia", "language_name": "Interlingua"}, {"language_code": "ga", "language_name": "Irish"}, {"language_code": "it", "language_name": "Italian"}, {"language_code": "ja", "language_name": "Japanese"}, {"language_code": "jw", "language_name": "Javanese"}, {"language_code": "kn", "language_name": "Kannada"}, {"language_code": "kk", "language_name": "Kazakh"}, {"language_code": "rw", "language_name": "Kinyarwanda"}, {"language_code": "rn", "language_name": "Kirundi"}, {"language_code": "kg", "language_name": "Kongo"}, {"language_code": "ko", "language_name": "Korean"}, {"language_code": "kri", "language_name": "Krio (Sierra Leone)"}, {"language_code": "ku", "language_name": "Kurdish"}, {"language_code": "ckb", "language_name": "Kurdish (Soranî)"}, {"language_code": "ky", "language_name": "Kyrgyz"}, {"language_code": "lo", "language_name": "Laothian"}, {"language_code": "la", "language_name": "Latin"}, {"language_code": "lv", "language_name": "Latvian"}, {"language_code": "ln", "language_name": "Lingala"}, {"language_code": "lt", "language_name": "Lithuanian"}, {"language_code": "loz", "language_name": "Lozi"}, {"language_code": "lg", "language_name": "Luganda"}, {"language_code": "ach", "language_name": "Luo"}, {"language_code": "mk", "language_name": "Macedonian"}, {"language_code": "mg", "language_name": "Malagasy"}, {"language_code": "my", "language_name": "Burmese"}, {"language_code": "ms", "language_name": "Malay"}, {"language_code": "ml", "language_name": "Malayalam"}, {"language_code": "mt", "language_name": "Maltese"}, {"language_code": "mv", "language_name": "Maldives"}, {"language_code": "mi", "language_name": "Maori"}, {"language_code": "mr", "language_name": "Marathi"}, {"language_code": "mfe", "language_name": "Mauritian Creole"}, {"language_code": "mo", "language_name": "Moldavian"}, {"language_code": "mn", "language_name": "Mongolian"}, {"language_code": "sr-me", "language_name": "Montenegrin"}, {"language_code": "ne", "language_name": "Nepali"}, {"language_code": "pcm", "language_name": "Nigerian Pidgin"}, {"language_code": "nso", "language_name": "Northern Sotho"}, {"language_code": "no", "language_name": "Norwegian"}, {"language_code": "nn", "language_name": "Norwegian (Nynorsk)"}, {"language_code": "oc", "language_name": "Occitan"}, {"language_code": "or", "language_name": "Oriya"}, {"language_code": "om", "language_name": "Oromo"}, {"language_code": "ps", "language_name": "Pashto"}, {"language_code": "fa", "language_name": "Persian"}, {"language_code": "pl", "language_name": "Polish"}, {"language_code": "pt", "language_name": "Portuguese"}, {"language_code": "pt-br", "language_name": "Portuguese (Brazil)"}, {"language_code": "pt-pt", "language_name": "Portuguese (Portugal)"}, {"language_code": "pa", "language_name": "Punjabi"}, {"language_code": "qu", "language_name": "Quechua"}, {"language_code": "ro", "language_name": "Romanian"}, {"language_code": "rm", "language_name": "Romansh"}, {"language_code": "nyn", "language_name": "Runyakitara"}, {"language_code": "ru", "language_name": "Russian"}, {"language_code": "gd", "language_name": "Scots Gaelic"}, {"language_code": "sr", "language_name": "Serbian"}, {"language_code": "sh", "language_name": "Serbo-Croatian"}, {"language_code": "st", "language_name": "Sesotho"}, {"language_code": "tn", "language_name": "Setswana"}, {"language_code": "crs", "language_name": "Seychellois Creole"}, {"language_code": "sn", "language_name": "Shona"}, {"language_code": "sd", "language_name": "Sindhi"}, {"language_code": "si", "language_name": "Sinhalese"}, {"language_code": "sk", "language_name": "Slovak"}, {"language_code": "sl", "language_name": "Slovenian"}, {"language_code": "so", "language_name": "Somali"}, {"language_code": "es", "language_name": "Spanish"}, {"language_code": "es-419", "language_name": "Spanish (Latin American)"}, {"language_code": "su", "language_name": "Sundanese"}, {"language_code": "sw", "language_name": "Swahili"}, {"language_code": "sv", "language_name": "Swedish"}, {"language_code": "tg", "language_name": "Tajik"}, {"language_code": "ta", "language_name": "Tamil"}, {"language_code": "tt", "language_name": "Tatar"}, {"language_code": "te", "language_name": "Telugu"}, {"language_code": "th", "language_name": "Thai"}, {"language_code": "ti", "language_name": "Tigrinya"}, {"language_code": "to", "language_name": "Tonga"}, {"language_code": "lua", "language_name": "Tshiluba"}, {"language_code": "tum", "language_name": "Tumbuka"}, {"language_code": "tr", "language_name": "Turkish"}, {"language_code": "tk", "language_name": "Turkmen"}, {"language_code": "tw", "language_name": "Twi"}, {"language_code": "ug", "language_name": "Uighur"}, {"language_code": "uk", "language_name": "Ukrainian"}, {"language_code": "ur", "language_name": "Urdu"}, {"language_code": "uz", "language_name": "Uzbek"}, {"language_code": "vu", "language_name": "Vanuatu"}, {"language_code": "vi", "language_name": "Vietnamese"}, {"language_code": "cy", "language_name": "Welsh"}, {"language_code": "wo", "language_name": "Wolof"}, {"language_code": "xh", "language_name": "Xhosa"}, {"language_code": "yi", "language_name": "Yiddish"}, {"language_code": "yo", "language_name": "Yoruba"}, {"language_code": "zu", "language_name": "Zulu"}
    ];

    const urlSelectionSchema = {
      "type": "object",
      "properties": {
        "selected_urls": {
          "type": "array",
          "items": { "type": "string" },
          "maxItems": 150,
          "description": "URLs selected for content fetching"
        }
      },
      "required": ["selected_urls"],
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
      // More specific XML check, avoiding overly broad matching of '<'
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

      // Add start and num parameters if they are valid positive integers
      if (Number.isInteger(searchParams.start) && searchParams.start >= 0) {
        params.append('start', searchParams.start.toString());
      }
      if (Number.isInteger(searchParams.num) && searchParams.num > 0) {
        params.append('num', searchParams.num.toString());
      } else {
        // Default to 10 results if num is not specified or invalid
        params.append('num', '10');
      }

      return `${baseUrl}?${params.toString()}`;
    }

    // Create simple query variations without AI
    function createQueryVariations(originalQuery) {
      const variations = [];
      
      // Original query
      variations.push(originalQuery);
      
      // Quoted query
      variations.push(`"${originalQuery}"`);
      
      // Query with common terms
      variations.push(`${originalQuery} information`);
      variations.push(`${originalQuery} news`);
      
      // Query without common stop words (if it makes a difference)
      const withoutStopWords = originalQuery.replace(/\b(the|a|an|in|on|at|to|for|of|with|and|or|but)\b/gi, '').replace(/\s+/g, ' ').trim();
      if (withoutStopWords && withoutStopWords !== originalQuery) {
        variations.push(withoutStopWords);
      }

      return variations.filter((v, index, self) => v.length > 0 && self.indexOf(v) === index).slice(0, 5);
    }

    // Execute searches in parallel and extract results
    async function executeSearches(searchQueries, searchParams) {
      const searchPromises = searchQueries.map(async (query, index) => {
        try {
          const searchUrl = buildGoogleSearchUrl(query, searchParams);
          const response = await fetch('https://api.brightdata.com/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serpApiKey}` },
            body: JSON.stringify({ zone: serpZone, url: searchUrl, format: 'raw' })
          });

          if (!response.ok) {
            const errorText = await response.text();
            return { query, index, success: false, error: `BrightData SERP API error for query '${query}' (${response.status}): ${errorText}` };
          }

          const htmlResult = await response.text();
          const bodyContent = extractBodyContent(htmlResult);

          const extractPrompt = `Extract search results from this Google search HTML content for the query: "${query}". 

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
            return { query, index, success: false, error: `OpenAI extraction error for query '${query}': Server error (${extractResponse.status}) - ${errorText}` };
          }

          const extractResult = await extractResponse.json();
          const extractedContent = extractResult.choices[0]?.message?.content;
          if (!extractedContent) {
            return { query, index, success: false, error: `No extraction result from OpenAI for query '${query}'` };
          }

          const parsedResults = JSON.parse(extractedContent);
          return {
            query,
            index,
            success: true,
            results: parsedResults.search_results || []
          };

        } catch (error) {
          return { query, index, success: false, error: `Search error for query '${query}': ${error.message}` };
        }
      });

      return Promise.all(searchPromises);
    }

    // Deduplicate and select relevant URLs
    async function selectRelevantUrls(allSearchResults, originalQuery, contextQuestion) {
      const seenUrls = new Set();
      const uniqueResults = [];

      allSearchResults.forEach(searchResult => {
        if (searchResult.success && searchResult.results) {
          searchResult.results.forEach(result => {
            if (result.url && !seenUrls.has(result.url)) {
              seenUrls.add(result.url);
              uniqueResults.push(result);
            }
          });
        }
      });

      if (uniqueResults.length === 0) {
        return { selected_urls: [] };
      }

      const selectionPrompt = `Select the most relevant URLs for comprehensive research on this topic:

Original Query: "${originalQuery}"
Context/Question: "${contextQuestion || 'General research'}"

Available search results:
${uniqueResults.map((result, index) => 
  `${index + 1}. Title: ${result.title}
   URL: ${result.url}
   Excerpt: ${result.excerpt}
   Source: ${result.source_name}`
).join('\n\n')}

Instructions:
1. Select URLs that are most relevant to answering the research question
2. Prioritize authoritative sources, official websites, and comprehensive content
3. Avoid duplicate or very similar content
4. Select up to 150 URLs maximum

Return only the selected URLs as an array of strings.`;

      const selectionRequestBody = {
        model: openaiModel,
        messages: [{ role: "user", content: selectionPrompt }],
        response_format: { 
          type: "json_schema", 
          json_schema: { 
            name: "url_selection", 
            strict: true, 
            schema: urlSelectionSchema 
          }
        },
        max_tokens: 16000,
        temperature: 0.2
      };

      const selectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
        body: JSON.stringify(selectionRequestBody)
      });

      if (!selectionResponse.ok) {
        throw new Error(`OpenAI URL selection error (${selectionResponse.status}): ${await selectionResponse.text()}`);
      }

      const selectionResult = await selectionResponse.json();
      const selectionContent = selectionResult.choices[0]?.message?.content;
      if (!selectionContent) {
        throw new Error('No URL selection result from OpenAI');
      }

      return JSON.parse(selectionContent);
    }

    // Fetch all URLs in parallel (no batching)
    async function fetchAllUrls(selectedUrls) {
      const fetchPromises = selectedUrls.map(async (targetUrl) => {
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
              error: `BrightData Web Unlocker API error for URL '${targetUrl}': ${response.status} ${errorText}`
            };
          }

          const rawContent = await response.text();
          const contentType = response.headers.get('content-type') || '';
          const processingType = getContentProcessingType(rawContent, contentType, targetUrl);

          if (processingType === 'html') {
            const bodyContent = extractBodyContent(rawContent);
            
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

            let aiProcessed = false;
            let aiError = null;
            try {
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
                    content: parsedContent.data.content
                  };
                } else {
                  aiError = new Error("No content extracted by OpenAI.");
                }
              } else {
                aiError = new Error(`OpenAI API error (${extractResponse.status}): ${await extractResponse.text()}`);
              }
            } catch (err) {
              aiError = err;
            }

            // If AI processing failed or didn't happen
            if (aiError) {
              return {
                url: targetUrl,
                success: false,
                error: `OpenAI content extraction failed for URL '${targetUrl}': ${aiError.message}`,
                content: bodyContent // Return full body content
              };
            }
            // Fall back to raw content if AI processing was not applicable or had unhandled issue (should be caught by aiError)
            return {
              url: targetUrl,
              success: true, // Successfully fetched, but not AI processed
              content: bodyContent // Return full body content
            };
          } else {
            return {
              url: targetUrl,
              success: true,
              content: rawContent
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

      return Promise.all(fetchPromises);
    }

    // Main logic
    if (action === 'search') {
      if (!serpApiKey)
        return { success: false, error: 'BrightData SERP API key not configured. Please set it in plugin settings.' };
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!openaiApiKey)
        return { success: false, error: 'OpenAI API key not configured. Please set it in plugin settings.' };
      if (!query)
        return { success: false, error: 'Query is required for search action.' };

      try {
        // Use provided gl/hl or default to us/en
        const searchParams = {
          tbm,
          ibp,
          gl: gl || 'us',
          hl: hl || 'en',
          start,
          num
        };

        // Create simple query variations
        const searchQueries = createQueryVariations(query);

        // Execute searches in parallel
        const searchResults = await executeSearches(searchQueries, searchParams);

        // Select relevant URLs
        const urlSelection = await selectRelevantUrls(searchResults, query, context_question);

        // Fetch content from all selected URLs in parallel
        const research_data = await fetchAllUrls(urlSelection.selected_urls);

        return {
          success: true,
          research_data
        };

      } catch (error) {
        return { success: false, error: `Search workflow error: ${error.message}` };
      }

    } else if (action === 'fetch') {
      if (!unlockerApiKey)
        return { success: false, error: 'BrightData Web Unlocker API key not configured. Please set it in plugin settings.' };
      if (!url)
        return { success: false, error: 'URL is required for fetch action.' };

      const wasInputArray = Array.isArray(url);
      const urlsToProcess = wasInputArray ? url : [url];

      async function processSingleUrl(targetUrl) {
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

          if (processingType === 'html') {
            const bodyContent = extractBodyContent(rawContent);
            if (openaiApiKey) {
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
                  } else {
                    // OpenAI returned 200 OK but no content
                    return {
                      url: targetUrl,
                      success: false,
                      error: `OpenAI content extraction failed for URL '${targetUrl}': No content returned by API.`,
                      content: {
                        title: null,
                        content: bodyContent, // Use full bodyContent
                        additional_research_queries: [],
                        url: targetUrl
                      },
                      content_type: "html"
                    };
                  }
                } else {
                  // OpenAI API error
                  const errorText = await extractResponse.text();
                  return {
                    url: targetUrl,
                    success: false,
                    error: `OpenAI content extraction failed for URL '${targetUrl}': API error (${extractResponse.status}) - ${errorText}`,
                    content: {
                      title: null,
                      content: bodyContent, // Use full bodyContent
                      additional_research_queries: [],
                      url: targetUrl
                    },
                    content_type: "html"
                  };
                }
              } catch (aiError) {
                // Catch other errors during AI processing (e.g., network issues, JSON parsing of AI response)
                return {
                  url: targetUrl,
                  success: false,
                  error: `OpenAI content extraction failed for URL '${targetUrl}': ${aiError.message}`,
                  content: {
                    title: null,
                    content: bodyContent, // Use full bodyContent
                    additional_research_queries: [],
                    url: targetUrl
                  },
                  content_type: "html"
                };
              }
            }
            
            // Fallback: use raw body content if AI processing is unavailable (no openaiApiKey)
            return {
              url: targetUrl,
              success: true, // Successfully fetched, but not AI processed
              content: {
                title: null,
                content: bodyContent, // Use full bodyContent
                additional_research_queries: [],
                url: targetUrl
              },
              content_type: "html"
            };
          } else {
            // Non-HTML content - return as-is
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
      }

      if (wasInputArray) {
        const results = await Promise.all(urlsToProcess.map(targetUrl => processSingleUrl(targetUrl)));
        return {
          success: true,
          results,
          total_urls: urlsToProcess.length
        };
      } else {
        return await processSingleUrl(urlsToProcess[0]);
      }

    } else {
      return { success: false, error: 'Invalid action. Must be either "search" or "fetch".' };
    }

  } catch (error) {
    return { success: false, error: `Unexpected error: ${error.message}` };
  }
}
