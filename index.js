    // --- (A) INTERNAL DATABASE LOGIC ---

        // --- (A.1) DATA PRE-LOADED FROM YOUR PDF ---
        // This data is based on the "Psych factors.pdf"
        const sourceData = [
            { factorName: 'Multiple/unknown', percentage: 60 },
            { factorName: 'Authority', percentage: 59 },
            { factorName: 'Credibility', percentage: 48 },
            { factorName: 'Familiarity', percentage: 43 },
            { factorName: 'Following business', percentage: 28 },
            { factorName: 'Fear/Loss Aversion', percentage: 24 },
            { factorName: 'Legitimacy', percentage: 19 },
            { factorName: 'Curiosity', percentage: 16 },
            { factorName: 'Attraction', percentage: 11 },
            { factorName: 'Urgency', percentage: 11 },
            { factorName: 'Reverse SE', percentage: 11 },
            { factorName: 'Intimidation', percentage: 10 },
            { factorName: 'Liking', percentage: 8 },
            { factorName: 'Building rapport', percentage: 7 },
            { factorName: 'Reciprocity', percentage: 7 },
            { factorName: 'Expertise', percentage: 7 },
            { factorName: 'Greed', percentage: 6 },
            { factorName: 'Desire to help', percentage: 6 },
            { factorName: 'SSO, Data, Finance', percentage: 5 },
            { factorName: 'Opportunity', percentage: 4 },
            { factorName:'Consistency', percentage: 4 },
            { factorName: 'Utility', percentage: 4 }
        ];

        // --- (A.2) Column/Key Definitions ---
        const keyFactor = 'factorName';
        const keyPercentage = 'percentage';

        // --- (A.3) DOM Elements (Internal) ---
        const selectFactor = document.getElementById('select-factor');
        const resultPlaceholder = document.getElementById('result-placeholder');
        const resultValue = document.getElementById('result-value');
        const resultLabel = document.getElementById('result-label');
        const learnMoreButton = document.getElementById('learn-more-button'); // New button
        
        // --- (A.4) Initialization Function (Internal) ---
        function initializeInternalApp() {
            // Sort data alphabetically for the dropdown
            sourceData.sort((a, b) => a[keyFactor].localeCompare(b[keyFactor]));
            populateDropdown();
            selectFactor.addEventListener('change', findPercentage);
            learnMoreButton.addEventListener('click', handleLearnMore); // New listener
        }

        /** (A.5) Populates the dropdown */
        function populateDropdown() {
            selectFactor.innerHTML = '<option value="default">Select a factor...</option>';
            sourceData.forEach(item => {
                const option = document.createElement('option');
                option.value = item[keyFactor];
                option.textContent = item[keyFactor];
                selectFactor.appendChild(option);
            });
        }

        /** (A.7) Finds and displays the percentage */
        function findPercentage() {
            const selectedValue = selectFactor.value;
            resultPlaceholder.classList.add('hidden');
            resultValue.classList.add('hidden');
            resultLabel.classList.add('hidden');
            
            if (selectedValue === 'default') {
                resultPlaceholder.classList.remove('hidden');
                learnMoreButton.disabled = true; // Disable "Learn More" button
                return;
            }

            learnMoreButton.disabled = false; // Enable "Learn More" button
            
            const match = sourceData.find(row => row[keyFactor] === selectedValue);
            if (match) {
                resultValue.textContent = `${match[keyPercentage]}%`;
                resultValue.classList.remove('hidden');
                resultLabel.classList.remove('hidden');
            }
        }
        
        // --- (B) LIVE WEB RESEARCH LOGIC ---

        // --- (B.1) DOM Elements (External) ---
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const loader = document.getElementById('loader');
        const searchError = document.getElementById('search-error');
        const searchPrompt = document.getElementById('search-prompt');
        const searchResults = document.getElementById('search-results');
        const summaryText = document.getElementById('summary-text');
        const sourcesList = document.getElementById('sources-list');
        const shareButton = document.getElementById('share-button');
        const copyNotification = document.getElementById('copy-notification');

        // --- (B.2) Event Listeners (External) ---
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });

        /** (B.3) Main search handler */
        async function handleSearch() {
            const query = searchInput.value.trim();
            if (!query) return;

            // Reset UI
            showLoading(true);
            showError(null);
            showResults(false);
            searchPrompt.classList.add('hidden');
            copyNotification.classList.add('hidden');
            shareButton.classList.add('hidden'); // Hide share button on new search

            try {
                // This function already uses the Gemini API (with Google Search)
                const response = await callGeminiAPI(query); 

                if (response.text || (response.sources && response.sources.length > 0)) {
                    displayResults(response.text, response.sources);
                } else {
                    showError('No relevant results found for this specific query.');
                }
            } catch (error) {
                console.error('Search failed:', error);
                showError(error.message || 'Failed to fetch results. Please try again.');
            } finally {
                showLoading(false);
            }
        }

        /** (B.4) Calls the Gemini API directly (for Preview environment) */
        async function callGeminiAPI(query) {
            // This empty key works in the "Preview" but will
            // FAIL when you deploy to Netlify.
            const apiKey = ""; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

            // This system prompt instructs the AI to act as an academic researcher
            const systemPrompt = `You are an academic cybersecurity research assistant.
            Your purpose is to find and summarize scholarly articles, conference papers, and reports from known cybersecurity institutions (e.g., NIST, ENISA, ACM, IEEE).
            You MUST follow these rules:
            1.  Your summary MUST be a direct synthesis of the information found in the provided Google Search sources.
            2.  **This is the most important rule:** You MUST cite your sources using inline notations like [Source 1], [Source 2], etc.
            3.  Each notation must correspond to the numbered source in the 'Grounded Sources' list.
            4.  **When listing sources:** Prioritize academic papers and official reports. If a source is from a known academic database (e.g., 'ACM Digital Library', 'IEEE Xplore', 'Springer') or institution ('NIST', 'ENISA'), you MUST name it in the source title.
            5.  Example of a good source title: "[IEEE Xplore] A new framework for deepfake detection."
            6.  If no academic sources are found, you may use high-quality, reputable news reports as a secondary option.
            7.  Focus on:
                a) Clear definitions of psychological factors.
                b) Specific cases of financial or data loss from these attacks.`;


            const payload = {
                contents: [{ parts: [{ text: query }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: [{ "google_search": {} }] // Enable Google Search grounding
            };

            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
                        throw new Error(`Server error (status ${response.status}). Retrying...`);
                    }

                    if (!response.ok) {
                        const errorBody = await response.json();
                        throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
                    }

                    const result = await response.json();
                    return processApiResponse(result);

                } catch (error) {
                    console.warn(error.message);
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }
        }
        
        /** (B.5) Processes the raw API response (from our function) */
        function processApiResponse(result) {
            const candidate = result.candidates?.[0];
            if (!candidate) {
                if (result.promptFeedback && result.promptFeedback.blockReason) {
                    throw new Error(`Query blocked: ${result.promptFeedback.blockReason}`);
                }
                throw new Error('Invalid API response structure.');
            }
            
            if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
                 throw new Error('Response blocked for safety or recitation reasons.');
            }
            
            const text = candidate.content?.parts?.[0]?.text || null;
            let sources = [];
            const metadata = candidate.groundingMetadata;
            
            if (metadata && metadata.groundingAttributions) {
                sources = metadata.groundingAttributions
                    .map(attr => ({
                        uri: attr.web?.uri,
                        title: attr.web?.title
                    }))
                    .filter(source => source.uri && source.title);
            }
            
            return { text, sources };
        }

        /** (B.6) Displays the results in the UI */
        function displayResults(summary, sources) {
            sourcesList.innerHTML = ''; // Clear old sources
            if (sources.length > 0) {
                sources.forEach((source, i) => {
                    const li = document.createElement('li');
                    li.className = "p-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors ml-4"; 
                    
                    const a = document.createElement('a');
                    a.href = source.uri;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.className = "flex items-center gap-3";
                    
                    const icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>`;
                    
                    const textDiv = document.createElement('div');
                    const titleP = document.createElement('p');
                    titleP.className = "text-sm font-medium text-blue-700 truncate";
                    // The AI prompt will now try to add text like "[IEEE Xplore]" to the title string
                    titleP.textContent = source.title; 
                    
                    const uriP = document.createElement('p');
                    uriP.className = "text-xs text-slate-500 truncate";
                    uriP.textContent = source.uri;
                    
                    textDiv.appendChild(titleP);
                    textDiv.appendChild(uriP);
                    a.innerHTML = icon;
                    a.appendChild(textDiv);
                    li.appendChild(a);
                    sourcesList.appendChild(li);
                });
            } else {
                // REVISION: This is now blank, as requested.
                sourcesList.innerHTML = '';
            }

            // Display summary
            if (summary) {
                summaryText.textContent = summary;
                summaryText.classList.remove('hidden');
            } else {
                summaryText.textContent = 'No summary was generated, but you can review the sources above.';
                summaryText.classList.remove('hidden');
            }

            shareButton.classList.remove('hidden'); // Show the share button
            
            // Assign click handler for Share Button
            shareButton.onclick = () => {
                shareResults(summary, sources, searchInput.value);
            };

            showResults(true);
        }

        /** (B.7) Share Results Function */
        function shareResults(summary, sources, query) {
            const shareTitle = `Research: ${query}`;
            const shareURL = window.location.href; 
            const summarySnippet = summary ? `${summary.substring(0, 200)}...` : 'Check out this research';
            
            let sourcesText = sources.map((s, i) => `[Source ${i+1}] ${s.title}: ${s.uri}`).join('\n');
            const fullTextReport = `Research on: "${query}"\n\nResearch Summary:\n${summary || 'N/A'}\n\nGrounded Sources:\n${sourcesText}\n\nFound via Cybersecurity Factor Database: ${shareURL}`;
            
            if (navigator.share) {
                // Use Web Share API (Mobile)
                navigator.share({
                    title: shareTitle,
                    text: `${summarySnippet}\n\More:`,
                    url: shareURL,
                })
                .catch((error) => console.log('Error sharing:', error));
            } else {
                // Fallback to Clipboard (Desktop)
                copyToClipboard(fullTextReport);
            }
        }

        /** (B.8) Copy to Clipboard Utility */
        function copyToClipboard(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                copyNotification.classList.remove('hidden');
                setTimeout(() => {
                    copyNotification.classList.add('hidden');
                }, 2000);
            } catch (err) {
                console.error('Failed to copy to clipboard:', err);
            }
            document.body.removeChild(textarea);
        }

        // --- (B.9) UI Helper Functions ---
        function showLoading(isLoading) {
            if (isLoading) {
                loader.classList.remove('hidden');
                loader.classList.add('flex');
            } else {
                loader.classList.add('hidden');
                loader.classList.remove('flex');
            }
        }

        function showError(message) {
            if (message) {
                searchError.querySelector('p').textContent = message;
                searchError.classList.remove('hidden');
                searchError.classList.add('flex');
            } else {
                searchError.classList.add('hidden');
                searchError.classList.remove('flex');
            }
        }

        function showResults(shouldShow) {
            if (shouldShow) {
                searchResults.classList.remove('hidden');
            } else {
                searchResults.classList.add('hidden');
            }
        }


        // --- (C) *** NEW FEATURE ***: MODAL & GENERATIVE AI LOGIC ---

        // --- (C.1) Modal DOM Elements ---
        const modal = document.getElementById('factor-modal');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalCloseButton = document.getElementById('modal-close-button');
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content-area');
        const modalLoader = document.getElementById('modal-loader');
        const modalError = document.getElementById('modal-error');

        // --- (C.2) Modal Event Listeners ---
        modalCloseButton.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);

        /** (C.3) Opens and populates the modal */
        function openModal() {
            const factorName = selectFactor.value;
            if (factorName === 'default') return;

            modalTitle.textContent = factorName;
            modalContent.innerHTML = ''; // Clear old content
            modalError.classList.add('hidden'); // Hide old errors
            modalLoader.classList.remove('hidden'); // Show loader
            modalLoader.classList.add('flex');
            modal.classList.remove('hidden');
            
            // Animate in
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('.modal-content').classList.remove('scale-95');
            }, 10);
        }

        /** (C.4) Closes the modal */
        function closeModal() {
            modal.classList.add('opacity-0');
            modal.querySelector('.modal-content').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 250); // Wait for animation
        }

        /** (C.5) Main handler for the "Learn More" button */
        async function handleLearnMore() {
            openModal(); // Open modal and show loader
            const factorName = selectFactor.value;

            try {
                // Call the new Gemini function
                const details = await callGeminiForDetails(factorName);
                
                // Format and display the structured data
                const html = `
                    <h4 class="text-xl font-bold text-slate-800 mb-2">Definition</h4>
                    <p class="text-slate-700 mb-5">${details.definition}</p>
                    
                    <h4 class="text-xl font-bold text-slate-800 mb-2">Example Attack Scenario</h4>
                    <pre class="bg-slate-100 p-4 rounded-lg text-slate-800 whitespace-pre-wrap font-sans mb-5">${details.example}</pre>
                    
                    <h4 class="text-xl font-bold text-slate-800 mb-2">Defense Tips</h4>
                    <ul class="list-disc list-inside text-slate-700 space-y-2">
                        ${details.defense_tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                `;
                modalContent.innerHTML = html;

            } catch (error) {
                console.error('Failed to generate details:', error);
                modalError.textContent = `Failed to generate insights: ${error.message}`;
                modalError.classList.remove('hidden');
            } finally {
                modalLoader.classList.add('hidden');
                modalLoader.classList.remove('flex');
            }
        }

        /** (C.6) New LLM Call: Generates details for a factor */
        async function callGeminiForDetails(factorName) {
            const apiKey = ""; // Same key, works in Preview
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

            // 1. Define the System Prompt
            const systemPrompt = `You are a cybersecurity training expert. 
            You provide clear, concise, and helpful information.
            The user will provide a psychological factor.
            You MUST respond ONLY with a JSON object matching the requested schema.`;

            // 2. Define the User Prompt
            const userPrompt = `For the social engineering principle "${factorName}", please provide:
            1.  A brief 'definition' (1-2 sentences).
            2.  A realistic 'example' attack scenario (as a short paragraph, email, or script).
            3.  A list of 3-5 scannable 'defense_tips' for an end-user.`;
            
            // 3. Define the JSON Schema we want the LLM to return
            const schema = {
                type: "OBJECT",
                properties: {
                    "definition": { "type": "STRING" },
                    "example": { "type": "STRING" },
                    "defense_tips": {
                        "type": "ARRAY",
                        "items": { "type": "STRING" }
                    }
                },
                required: ["definition", "example", "defense_tips"]
            };

            // 4. Construct the Payload
            const payload = {
                contents: [
                    { role: "user", parts: [{ text: userPrompt }] }
                ],
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    temperature: 0.5 // A little creative for the example
                }
            };

            // 5. Make the API Call (with retries)
            let retries = 3;
            let delay = 1000;

            while (retries > 0) {
                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
                        throw new Error(`Server error (status ${response.status}). Retrying...`);
                    }

                    if (!response.ok) {
                        const errorBody = await response.json();
                        throw new Error(`API Error: ${errorBody.error?.message || response.statusText}`);
                    }

                    const result = await response.json();

                    // 6. Parse the JSON response
                    const candidate = result.candidates?.[0];
                    if (candidate && candidate.content?.parts?.[0]?.text) {
                        return JSON.parse(candidate.content.parts[0].text);
                    } else {
                        throw new Error("Invalid response structure from generative API.");
                    }

                } catch (error) {
                    console.warn(error.message);
                    retries--;
                    if (retries === 0) throw error;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }
        }


        // --- (D) INITIALIZE THE APP ---
        document.addEventListener('DOMContentLoaded', initializeInternalApp);
