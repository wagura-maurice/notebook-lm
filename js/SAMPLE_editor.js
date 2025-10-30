        // Global state
        let editMode = false;
        let currentChunkId = null;
        let allChunksData = {};
        let changes = {};
        let editingEntity = null;
        let originalHTMLContent = {}; // Store original HTML for each chunk

        /**
         * Load the JSON data asynchronously
         */
        async function loadChunksData() {
            try {
                const response = await fetch('./assets/SAMPLE_editor2.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                allChunksData = await response.json();
                console.log('Chunks data loaded successfully');
                
                // Initialize the application after loading data
                initializeApp();
            } catch (error) {
                console.error('Error loading chunks data:', error);
                alert('Failed to load document data. Please try again later.');
            }
        }

        /**
         * Initialize the application
         */
        function initializeApp() {
            try {
                // Build dynamic UI
                buildDocumentOutline();
                buildDocumentContent();
                updateDocumentHeader();

                // Set up all event listeners
                setupEventListeners();

                // If there's a hash in the URL, try to select that chunk
                if (window.location.hash) {
                    const chunkId = window.location.hash.substring(1);
                    if (allChunksData[chunkId]) {
                        selectChunk(chunkId);
                    }
                }

                // Update UI based on initial state
                updateUIForEditMode();
            } catch (error) {
                console.error('Error initializing application:', error);
                alert('Failed to initialize the application. Please refresh the page.');
            }
        }

        /**
         * Update document header with title and metadata
         */
        function updateDocumentHeader() {
            const documentTitle = document.querySelector('.document-title');
            const documentMeta = document.querySelector('.document-meta');
            
            if (!documentTitle || !documentMeta) return;
            
            // Get document title from first chunk
            const rawTitle = allChunksData[Object.keys(allChunksData)[0]]?.doc || "Document Title Loading...";
            documentTitle.textContent = rawTitle
                .replace(/_/g, ' ')
                .replace(/\./g, ' ')  // Replace dots with spaces
                .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
                .trim();
            
            // Calculate total word count
            let totalWords = 0;
            Object.values(allChunksData).forEach(chunk => {
                if (chunk.meta?.words) {
                    totalWords += chunk.meta.words;
                }
            });
            
            const keys = Object.keys(allChunksData);
            const lastKey = keys[keys.length - 1];
            const timestamp = allChunksData[lastKey]?._ts || 'N/A';
            
            documentMeta.textContent = `${keys.length} chunks | ${totalWords} words | Generated: ${timestamp}`;
        }

        /**
         * Build document outline/navigation structure from chunks data
         */
        /**
         * Parse text and identify heading levels
         * Returns an object with heading text, level, and content
         */
        function parseHeadings(text, chunkId) {
            if (!text) return { level: 0, title: 'Untitled', content: '' };
            
            // Check for markdown-style headers
            const headerMatch = text.match(/^(#+)\s*(.*?)(?:\n|$)/);
            if (headerMatch) {
                const [_, hashes, title] = headerMatch;
                const level = hashes.length;
                const content = text.replace(headerMatch[0], '').trim();
                return { level, title: title.trim(), content, chunkId };
            }
            
            // Check for bold text as potential title
            const boldMatch = text.match(/^\*\*(.*?)\*\*/);
            if (boldMatch) {
                return { level: 3, title: boldMatch[1].trim(), content: text, chunkId };
            }
            
            // Default to paragraph if no heading found
            return { level: 0, title: `Section ${chunkId}`, content: text, chunkId };
        }

        /**
         * Toggle section collapse/expand
         * Ensures only one section is open at a time
         */
        function toggleSection(sectionHeader) {
            const section = sectionHeader.closest('.outline-section');
            const content = section.querySelector('.outline-section-content');
            const isCollapsing = !sectionHeader.classList.contains('collapsed');
            
            // Close all other sections first
            document.querySelectorAll('.outline-section-header').forEach(header => {
                if (header !== sectionHeader) {
                    header.classList.add('collapsed');
                    const otherContent = header.nextElementSibling;
                    if (otherContent && otherContent.classList.contains('outline-section-content')) {
                        otherContent.style.maxHeight = '0';
                    }
                }
            });
            
            // Toggle the clicked section
            if (isCollapsing) {
                sectionHeader.classList.add('collapsed');
                content.style.maxHeight = '0';
            } else {
                sectionHeader.classList.remove('collapsed');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        }

        /**
         * Build document outline with hierarchical structure and collapsible sections
         */
        function buildDocumentOutline() {
            const outline = document.getElementById('outline');
            if (!outline) return;

            // Clear existing outline content
            outline.innerHTML = '';

            // Add sidebar header
            const sidebarHeader = document.createElement('div');
            sidebarHeader.className = 'sidebar-header';
            
            const sidebarTitle = document.createElement('div');
            sidebarTitle.className = 'sidebar-title';
            sidebarTitle.textContent = 'Table of Contents';
            
            const sidebarSubtitle = document.createElement('div');
            sidebarSubtitle.className = 'sidebar-subtitle';
            sidebarSubtitle.textContent = `${Object.keys(allChunksData).length} sections`;
            
            sidebarHeader.appendChild(sidebarTitle);
            sidebarHeader.appendChild(sidebarSubtitle);
            outline.appendChild(sidebarHeader);

            // Group chunks by section
            const sections = {};
            const chunkKeys = Object.keys(allChunksData);
            
            // First pass: group chunks by section
            chunkKeys.forEach(chunkId => {
                const chunk = allChunksData[chunkId];
                const { level, title } = parseHeadings(chunk.text, chunkId);
                
                // For top-level sections (level 1)
                if (level === 1) {
                    sections[chunkId] = {
                        title: title || `Section ${chunkId}`,
                        chunks: [chunkId],
                        level: 1
                    };
                } else {
                    // Find the nearest parent section
                    let parentSectionId = null;
                    for (let i = chunkKeys.indexOf(chunkId) - 1; i >= 0; i--) {
                        const prevChunkId = chunkKeys[i];
                        const prevLevel = parseHeadings(allChunksData[prevChunkId].text, prevChunkId).level;
                        if (prevLevel < level) {
                            parentSectionId = prevChunkId;
                            break;
                        }
                    }
                    
                    if (parentSectionId && sections[parentSectionId]) {
                        sections[parentSectionId].chunks.push(chunkId);
                    } else {
                        // If no parent section found, create a new section
                        sections[chunkId] = {
                            title: title || `Section ${chunkId}`,
                            chunks: [chunkId],
                            level: level
                        };
                    }
                }
            });

            // Second pass: build the outline with collapsible sections
            let isFirstSection = true;
            Object.entries(sections).forEach(([sectionId, sectionData]) => {
                const section = document.createElement('div');
                section.className = 'outline-section';
                
                // Create section header
                const sectionHeader = document.createElement('div');
                sectionHeader.className = 'outline-section-header';
                
                // Only expand the first section by default
                if (isFirstSection) {
                    sectionHeader.classList.remove('collapsed');
                    isFirstSection = false;
                } else {
                    sectionHeader.classList.add('collapsed');
                }
                
                const toggle = document.createElement('span');
                toggle.className = 'outline-toggle';
                toggle.innerHTML = '▼';
                
                const sectionTitle = document.createElement('span');
                sectionTitle.className = 'outline-section-title';
                sectionTitle.textContent = sectionData.title;
                
                const chunkCount = document.createElement('span');
                chunkCount.className = 'outline-chunk-count';
                chunkCount.textContent = sectionData.chunks.length;
                
                sectionHeader.appendChild(toggle);
                sectionHeader.appendChild(sectionTitle);
                sectionHeader.appendChild(chunkCount);
                
                // Create section content
                const sectionContent = document.createElement('div');
                sectionContent.className = 'outline-section-content';
                
                // Add chunks to the section
                sectionData.chunks.forEach(chunkId => {
                    const chunk = allChunksData[chunkId];
                    const { title } = parseHeadings(chunk.text, chunkId);
                    
                    // Create nav item
                    const navItem = document.createElement('div');
                    navItem.className = 'nav-item';
                    navItem.dataset.chunkId = chunkId;
                    
                    // Create nav item title
                    const navItemTitle = document.createElement('div');
                    navItemTitle.className = 'nav-item-title';
                    navItemTitle.textContent = chunk.enrichment.title || `Section ${chunkId}`;
                    
                    // Create meta info (ID and confidence)
                    const navItemMeta = document.createElement('div');
                    navItemMeta.className = 'nav-item-meta';
                    
                    const itemId = document.createElement('span');
                    itemId.className = 'nav-item-id';
                    itemId.textContent = chunk.chunk_id;
                    
                    const confidence = document.createElement('span');
                    confidence.className = 'nav-item-confidence';
                    confidence.textContent = chunk.enrichment.confidence * 100 + '%';
                    
                    navItemMeta.appendChild(itemId);
                    navItemMeta.appendChild(confidence);
                    
                    // Add click handler to scroll to section
                    navItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const element = document.getElementById(chunkId);
                        if (element) {
                            // Scroll the document to show the section
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            
                            // Update active state in TOC
                            document.querySelectorAll('.nav-item').forEach(item => {
                                item.classList.remove('active');
                            });
                            navItem.classList.add('active');
                            
                            // Ensure the parent section is expanded
                            const section = navItem.closest('.outline-section');
                            if (section) {
                                const sectionHeader = section.querySelector('.outline-section-header');
                                const sectionContent = section.querySelector('.outline-section-content');
                                
                                if (sectionHeader && sectionHeader.classList.contains('collapsed')) {
                                    sectionHeader.classList.remove('collapsed');
                                    sectionContent.style.maxHeight = sectionContent.scrollHeight + 'px';
                                }
                                
                                // Scroll the TOC to show the active item
                                const outline = document.getElementById('outline');
                                const navItemRect = navItem.getBoundingClientRect();
                                const outlineRect = outline.getBoundingClientRect();
                                
                                // Calculate scroll position to center the item
                                const navItemTop = navItemRect.top + window.scrollY;
                                const outlineTop = outlineRect.top + window.scrollY;
                                const navItemHeight = navItem.offsetHeight;
                                const outlineHeight = outline.offsetHeight;
                                
                                // Calculate the scroll position to center the nav item
                                const scrollTo = navItemTop - outlineTop - (outlineHeight / 2) + (navItemHeight / 2);
                                
                                // Smooth scroll to the nav item
                                outline.scrollTo({
                                    top: scrollTo,
                                    behavior: 'smooth'
                                });
                            }
                        }
                    });
                    
                    navItem.appendChild(navItemTitle);
                    navItem.appendChild(navItemMeta);
                    sectionContent.appendChild(navItem);
                });
                
                // Set initial state for section content
                if (!sectionHeader.classList.contains('collapsed')) {
                    // Use setTimeout to ensure the element is in the DOM before calculating scrollHeight
                    setTimeout(() => {
                        sectionContent.style.maxHeight = sectionContent.scrollHeight + 'px';
                    }, 0);
                } else {
                    sectionContent.style.maxHeight = '0';
                }
                
                // Toggle section on header click
                sectionHeader.addEventListener('click', () => toggleSection(sectionHeader));
                
                section.appendChild(sectionHeader);
                section.appendChild(sectionContent);
                outline.appendChild(section);
            });
            
            // Add scroll event listener to highlight current section
            const documentWrapper = document.querySelector('.document-wrapper');
            if (documentWrapper) {
                documentWrapper.addEventListener('scroll', () => {
                    const scrollPosition = documentWrapper.scrollTop;
                    let currentSection = null;
                    let smallestDistance = Number.POSITIVE_INFINITY;
                    
                    // Get all chunk elements
                    const chunkElements = document.querySelectorAll('.chunk-boundary');
                    
                    // Find the chunk closest to the top of the viewport
                    chunkElements.forEach(element => {
                        const rect = element.getBoundingClientRect();
                        const distance = Math.abs(rect.top);
                        
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            currentSection = element.id;
                        }
                    });
                    
                    if (currentSection) {
                        // Update active state in TOC
                        document.querySelectorAll('.nav-item').forEach(item => {
                            const isActive = item.dataset.chunkId === currentSection;
                            item.classList.toggle('active', isActive);
                            
                            // If this is the active item, ensure its section is expanded
                            if (isActive) {
                                const section = item.closest('.outline-section');
                                if (section) {
                                    const sectionHeader = section.querySelector('.outline-section-header');
                                    const sectionContent = section.querySelector('.outline-section-content');
                                    
                                    if (sectionHeader && sectionContent && sectionHeader.classList.contains('collapsed')) {
                                        sectionHeader.classList.remove('collapsed');
                                        sectionContent.style.maxHeight = sectionContent.scrollHeight + 'px';
                                        
                                        // Scroll the TOC to show the active item
                                        const outline = document.getElementById('outline');
                                        const navItemRect = item.getBoundingClientRect();
                                        const outlineRect = outline.getBoundingClientRect();
                                        
                                        // Calculate scroll position to center the item
                                        const navItemTop = navItemRect.top + window.scrollY;
                                        const outlineTop = outlineRect.top + window.scrollY;
                                        const navItemHeight = item.offsetHeight;
                                        const outlineHeight = outline.offsetHeight;
                                        
                                        // Calculate the scroll position to center the nav item
                                        const scrollTo = navItemTop - outlineTop - (outlineHeight / 2) + (navItemHeight / 2);
                                        
                                        // Smooth scroll to the nav item
                                        outline.scrollTo({
                                            top: scrollTo,
                                            behavior: 'smooth'
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
                
                // Trigger initial scroll to highlight the first section
                setTimeout(() => {
                    const firstChunk = document.querySelector('.chunk-boundary');
                    if (firstChunk) {
                        firstChunk.scrollIntoView({ behavior: 'auto', block: 'start' });
                    }
                }, 100);
            }
        }

        /**
         * Build document content with chunks and entity highlighting
         */
        function buildDocumentContent() {
            const docContent = document.getElementById('document-content');
            if (!docContent) return;

            docContent.innerHTML = '';

            const chunkKeys = Object.keys(allChunksData);
            chunkKeys.forEach(chunkId => {
                const chunk = allChunksData[chunkId];
                const { level, title, content } = parseHeadings(chunk.text, chunkId);
                
                // Create chunk boundary div
                const chunkBoundary = document.createElement('div');
                chunkBoundary.className = 'chunk-boundary';
                chunkBoundary.dataset.chunkId = chunkId;
                chunkBoundary.id = chunkId;
                
                // Create chunk badge
                const chunkBadge = document.createElement('div');
                chunkBadge.className = 'chunk-badge';
                const role = chunk.enrichment.rhetorical_role || 'other';
                const confidence = Math.round((chunk.enrichment.confidence || 0) * 100);
                chunkBadge.textContent = `${chunk.chunk_id} | ${role.charAt(0).toUpperCase() + role.slice(1)} | ${confidence}%`;
                
                // Create appropriate heading element based on level
                let headingElement;
                if (level > 0) {
                    const headingLevel = Math.min(level, 6); // Max h6
                    headingElement = document.createElement(`h${headingLevel}`);
                    headingElement.className = `heading-level-${headingLevel}`;
                    headingElement.textContent = title;
                }
                
                // Create content container
                const contentContainer = document.createElement('div');
                contentContainer.className = 'content-container';
                
                // Add content (excluding the title if it was a heading)
                const contentParagraph = document.createElement('div');
                contentParagraph.className = 'content-paragraph';
                contentParagraph.innerHTML = level > 0 ? content : chunk.text || 'No content available';
                
                // Highlight entities in the content
                highlightEntitiesInElement(contentParagraph, chunk.enrichment.entities || []);
                
                // Assemble the chunk
                chunkBoundary.appendChild(chunkBadge);
                if (headingElement) {
                    chunkBoundary.appendChild(headingElement);
                }
                contentContainer.appendChild(contentParagraph);
                chunkBoundary.appendChild(contentContainer);
                
                // Add metadata attributes for styling and interaction
                chunkBoundary.dataset.level = level;
                chunkBoundary.dataset.role = role.toLowerCase();
                
                docContent.appendChild(chunkBoundary);
            });
        }

        /**
         * Escape special regex characters
         */
        function escapeRegex(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        /**
         * Highlight entities in an element's text nodes
         * @param {HTMLElement} element - The element containing text to highlight
         * @param {Array} entities - Array of entity objects with text, type, and confidence
         */
        function highlightEntitiesInElement(element, entities) {
            try {
                // Check for valid input
                if (!element || !element.innerHTML) return;
                if (!Array.isArray(entities) || entities.length === 0) return;
                
                // Filter out invalid entities and ensure required properties exist
                const validEntities = entities.filter(entity => 
                    entity && 
                    typeof entity === 'object' && 
                    entity.text && 
                    typeof entity.text === 'string' &&
                    entity.type && 
                    typeof entity.type === 'string'
                );
                
                if (validEntities.length === 0) return;

                // Sort entities by length (longest first) to handle nested entities correctly
                const sortedEntities = [...validEntities].sort((a, b) => {
                    const lenA = a.text ? a.text.length : 0;
                    const lenB = b.text ? b.text.length : 0;
                    return lenB - lenA;
                });
                
                // Get the current HTML content
                let html = element.innerHTML;
                if (!html) return;
                
                // Create a map to store entity replacements
                const replacements = [];
                const processedTexts = new Set();
                
                // Process each entity
                sortedEntities.forEach((entity, idx) => {
                    try {
                        const entityText = entity.text ? entity.text.trim() : '';
                        if (!entityText || processedTexts.has(entityText)) return;
                        
                        processedTexts.add(entityText);
                        const placeholder = `__ENTITY_${idx}__`;
                        
                        // Escape special regex characters in the entity text
                        const escapedText = escapeRegex(entityText);
                        
                        // Skip if the text isn't found in the HTML
                        if (!html.includes(entityText)) return;
                        
                        // Create the highlighted span with tooltip
                        const span = document.createElement('span');
                        span.className = `entity entity-${entity.type || 'unknown'}`;
                        span.textContent = entityText;
                        
                        const tooltip = document.createElement('span');
                        tooltip.className = 'tooltip';
                        tooltip.textContent = `${(entity.type || 'UNKNOWN').toUpperCase()}: ${entityText} (conf: ${(entity.confidence || 1).toFixed(2)})`;
                        span.appendChild(tooltip);
                        
                        // Store the replacement
                        replacements.push({
                            placeholder: placeholder,
                            html: span.outerHTML,
                            text: entityText
                        });
                        
                        // Replace all occurrences of the entity text with a placeholder
                        const regex = new RegExp(escapedText, 'g');
                        html = html.replace(regex, (match, offset, fullText) => {
                            // Check if the match is inside an HTML tag
                            const before = fullText.substring(0, offset);
                            const lastTagOpen = before.lastIndexOf('<');
                            const lastTagClose = before.lastIndexOf('>');
                            
                            // Only replace if not inside a tag
                            if (lastTagOpen === -1 || lastTagClose > lastTagOpen) {
                                return placeholder;
                            }
                            return match;
                        });
                    } catch (e) {
                        console.warn('Error processing entity:', entity, e);
                    }
                });
                
                // Replace all placeholders with the actual HTML
                if (replacements.length > 0) {
                    try {
                        // Do a single pass through the HTML for all replacements
                        const regex = new RegExp(replacements.map(r => escapeRegex(r.placeholder)).join('|'), 'g');
                        html = html.replace(regex, (match) => {
                            const replacement = replacements.find(r => r.placeholder === match);
                            return replacement ? replacement.html : match;
                        });
                        
                        // Update the element's HTML
                        element.innerHTML = html;
                    } catch (e) {
                        console.error('Error applying entity highlights:', e);
                    }
                }
            } catch (error) {
                console.error('Error in highlightEntitiesInElement:', error);
            }
        }

        /**
         * Set up all event listeners
         */
        function setupEventListeners() {
            setupChunkListeners();
            setupNavigationListeners();

            // Add keyboard shortcuts
            document.addEventListener('keydown', handleKeyDown);

            // Add window resize handler
            window.addEventListener('resize', handleWindowResize);
        }

        function setupChunkListeners() {
            document.querySelectorAll('.chunk-boundary').forEach(chunk => {
                chunk.addEventListener('click', function(e) {
                    if (e.target.tagName === 'A') return;
                    const chunkId = this.dataset.chunkId;
                    selectChunk(chunkId);
                });
            });
        }

        function setupNavigationListeners() {
            document.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', function() {
                    const chunkId = this.dataset.chunkId;
                    selectChunk(chunkId);
                    scrollToChunk(chunkId);
                });
            });
        }

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                closeMetadata();
                closeEntityModal();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                exportAnnotations();
            }
        }

        function handleWindowResize() {
            // Update any responsive elements here
        }

        function selectChunk(chunkId) {
            currentChunkId = chunkId;

            // Update UI
            document.querySelectorAll('.chunk-boundary').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(c => c.classList.remove('active'));

            const chunkEl = document.querySelector(`.chunk-boundary[data-chunk-id="${chunkId}"]`);
            const navItem = document.querySelector(`.nav-item[data-chunk-id="${chunkId}"]`);

            if (chunkEl) chunkEl.classList.add('active');
            if (navItem) {
                navItem.classList.add('active');
                navItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Show metadata
            showMetadata(chunkId);
        }

        function scrollToChunk(chunkId) {
            const chunk = document.querySelector(`.chunk-boundary[data-chunk-id="${chunkId}"]`);
            if (chunk) {
                chunk.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function showMetadata(chunkId) {
            const chunkData = allChunksData[chunkId];
            if (!chunkData) return;

            const panel = document.getElementById('metadata-panel');
            const content = document.getElementById('metadata-content');

            const chunkChanges = changes[chunkId] || {};
            let html = '';

            // Helper function to escape HTML
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Summary
            const summary = chunkChanges.summary !== undefined ? chunkChanges.summary : chunkData.enrichment.summary;
            const summaryEdited = chunkChanges.summary !== undefined;
            const escapedSummary = escapeHtml(summary || 'No summary');

            html += `
            <div class="metadata-section">
                <div class="metadata-title">Summary</div>
                <textarea
                    class="editable-field ${summaryEdited ? 'edited' : ''}"
                    id="summary-field"
                    ${editMode ? '' : 'readonly'}
                    onchange="updateField('${chunkId}', 'summary', this.value)"
                >${escapedSummary}</textarea>
            </div>
            `;

            // Rhetorical Role
            const role = chunkChanges.rhetorical_role !== undefined ? chunkChanges.rhetorical_role : chunkData.enrichment.rhetorical_role;
            const roleEdited = chunkChanges.rhetorical_role !== undefined;

            html += `
            <div class="metadata-section">
                <div class="metadata-title">Rhetorical Role</div>
                <select
                    class="editable-field ${roleEdited ? 'edited' : ''}"
                    id="role-field"
                    ${editMode ? '' : 'disabled'}
                    onchange="updateField('${chunkId}', 'rhetorical_role', this.value)"
                >
                    <option value="background">Background</option>
                    <option value="definition">Definition</option>
                    <option value="method">Method</option>
                    <option value="procedure">Procedure</option>
                    <option value="result">Result</option>
                    <option value="discussion">Discussion</option>
                    <option value="recommendation">Recommendation</option>
                    <option value="limitation">Limitation</option>
                    <option value="example">Example</option>
                    <option value="conclusion">Conclusion</option>
                    <option value="other">Other</option>
                </select>
            </div>
            `;

            setTimeout(() => {
                const roleSelect = document.getElementById('role-field');
                if (roleSelect) roleSelect.value = role;
            }, 0);

            // Keywords
            const keywords = chunkChanges.keywords !== undefined ? chunkChanges.keywords : chunkData.enrichment.keywords;
            html += `
            <div class="metadata-section">
                <div class="metadata-title">Keywords (${keywords.length})</div>
                <div class="keywords-editor" id="keywords-editor">
            `;

            keywords.forEach((kw, idx) => {
                const escapedKw = escapeHtml(kw);
                html += `
                <span class="keyword-tag ${editMode ? 'editable' : ''}">
                    ${escapedKw}
                    ${editMode ? `<span class="keyword-remove" onclick="removeKeyword('${chunkId}', ${idx})">×</span>` : ''}
                </span>
                `;
            });

            if (editMode) {
                html += `<button class="keyword-add" onclick="addKeyword('${chunkId}')">+ Add</button>`;
            }

            html += '</div></div>';

            // Entities
            const entities = chunkChanges.entities !== undefined ? chunkChanges.entities : chunkData.enrichment.entities;
            html += `
            <div class="metadata-section">
                <div class="metadata-title">Entities (${entities.length})</div>
                <div class="entity-editor">
            `;

            entities.forEach((entity, idx) => {
                const color = getEntityColor(entity.type);
                const escapedText = escapeHtml(entity.text);
                const escapedType = escapeHtml(entity.type);
                html += `
                <div class="entity-item ${editMode ? 'editable' : ''}" onclick="${editMode ? `editEntity('${chunkId}', ${idx})` : ''}">
                    <div class="entity-text">${escapedText}</div>
                    <div class="entity-type-badge" style="background: ${color};">${escapedType}</div>
                    ${editMode ? `<button class="entity-remove" onclick="event.stopPropagation(); removeEntity('${chunkId}', ${idx})">×</button>` : ''}
                </div>
                `;
            });

            if (editMode) {
                html += `<button class="entity-add" onclick="addEntity('${chunkId}')">+ Add Entity</button>`;
            }

            html += '</div></div>';

            // Statistics
            html += `
            <div class="metadata-section">
                <div class="metadata-title">Statistics</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${chunkData.meta.words}</div>
                        <div style="font-size: 11px; color: #7f8c8d;">Words</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: center;">
                        <div style="font-size: 24px; font-weight: 700; color: #667eea;">${chunkData.meta.sentences}</div>
                        <div style="font-size: 11px; color: #7f8c8d;">Sentences</div>
                    </div>
                </div>
            </div>
            `;

            content.innerHTML = html;
            panel.classList.add('visible');
        }

        function getEntityColor(type) {
            const colors = {
                person: '#FFB3BA',
                org: '#BAFFC9',
                location: '#BAE1FF',
                program: '#FFFFBA',
                date: '#FFD8BA',
                amount: '#E0BBE4',
                metric: '#FFDAB9',
                law: '#C7CEEA',
                policy: '#B5EAD7'
            };
            return colors[type] || '#f0f0f0';
        }

        function closeMetadata() {
            document.getElementById('metadata-panel').classList.remove('visible');
            document.querySelectorAll('.chunk-boundary').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(c => c.classList.remove('active'));
            currentChunkId = null;
        }

        function toggleEditMode() {
            editMode = !editMode;
            const toggle = document.getElementById('mode-toggle');
            const modeText = document.getElementById('mode-text');
            const docContent = document.getElementById('document-content');

            if (editMode) {
                toggle.classList.add('edit-mode');
                modeText.textContent = 'Switch to View Mode';
                docContent.classList.add('edit-mode');
            } else {
                toggle.classList.remove('edit-mode');
                modeText.textContent = 'Switch to Edit Mode';
                docContent.classList.remove('edit-mode');
            }

            if (currentChunkId) {
                showMetadata(currentChunkId);
            }
        }

        function updateUIForEditMode() {
            // Called after initialization
            updateChangeBadge();
        }

        function trackChange(chunkId, field, value) {
            if (!changes[chunkId]) {
                changes[chunkId] = {};
            }
            changes[chunkId][field] = value;

            updateChangeBadge();
            markChunkAsEdited(chunkId);
        }

        function updateChangeBadge() {
            const count = Object.keys(changes).length;
            const badge = document.getElementById('changes-badge');
            const countEl = document.getElementById('changes-count');

            if (count > 0) {
                badge.style.display = 'block';
                countEl.textContent = count;
            } else {
                badge.style.display = 'none';
            }
        }

        function markChunkAsEdited(chunkId) {
            const chunk = document.querySelector(`.chunk-boundary[data-chunk-id="${chunkId}"]`);
            const navItem = document.querySelector(`.nav-item[data-chunk-id="${chunkId}"]`);

            if (chunk && !chunk.classList.contains('edited')) {
                chunk.classList.add('edited');
                const badge = document.createElement('span');
                badge.className = 'edit-badge';
                badge.textContent = 'EDITED';
                chunk.appendChild(badge);
            }

            if (navItem) {
                navItem.classList.add('edited');
            }
        }

        function updateField(chunkId, field, value) {
            trackChange(chunkId, field, value);
            showMetadata(chunkId);
        }

        function removeKeyword(chunkId, index) {
            const chunkData = allChunksData[chunkId];
            const currentKeywords = changes[chunkId]?.keywords || chunkData.enrichment.keywords || [];
            const newKeywords = currentKeywords.filter((_, i) => i !== index);
            trackChange(chunkId, 'keywords', newKeywords);
            showMetadata(chunkId);
        }

        function addKeyword(chunkId) {
            const kw = prompt('Enter new keyword:');
            if (kw && kw.trim()) {
                const chunkData = allChunksData[chunkId];
                const currentKeywords = changes[chunkId]?.keywords || chunkData.enrichment.keywords || [];
                const newKeywords = [...currentKeywords, kw.trim()];
                trackChange(chunkId, 'keywords', newKeywords);
                showMetadata(chunkId);
            }
        }

        function removeEntity(chunkId, index) {
            const chunkData = allChunksData[chunkId];
            const currentEntities = changes[chunkId]?.entities || chunkData.enrichment.entities || [];
            const newEntities = currentEntities.filter((_, i) => i !== index);
            trackChange(chunkId, 'entities', newEntities);
            showMetadata(chunkId);
            
            // Rebuild the document content to reflect entity changes
            buildDocumentContent();
            setupEventListeners();
        }

        function editEntity(chunkId, index) {
            const chunkData = allChunksData[chunkId];
            const currentEntities = changes[chunkId]?.entities || chunkData.enrichment.entities || [];
            const entity = currentEntities[index];

            editingEntity = { chunkId, index, entity };

            document.getElementById('entity-text-input').value = entity.text;
            document.getElementById('entity-type-input').value = entity.type;
            document.getElementById('entity-modal').classList.add('visible');
        }

        function addEntity(chunkId) {
            const text = prompt('Enter entity text:');
            if (!text || !text.trim()) return;

            const type = prompt('Enter entity type (person/org/location/program/date/amount/metric/law/policy):');
            if (!type || !type.trim()) return;

            const chunkData = allChunksData[chunkId];
            const currentEntities = changes[chunkId]?.entities || chunkData.enrichment.entities || [];
            const newEntity = { text: text.trim(), type: type.trim(), confidence: 1.0 };
            const newEntities = [...currentEntities, newEntity];

            trackChange(chunkId, 'entities', newEntities);
            showMetadata(chunkId);
            
            // Rebuild the document content to reflect entity changes
            buildDocumentContent();
            setupEventListeners();
        }

        function closeEntityModal() {
            document.getElementById('entity-modal').classList.remove('visible');
            editingEntity = null;
        }

        function saveEntityEdit() {
            if (!editingEntity) return;

            const { chunkId, index } = editingEntity;
            const newText = document.getElementById('entity-text-input').value;
            const newType = document.getElementById('entity-type-input').value;

            const chunkData = allChunksData[chunkId];
            const currentEntities = changes[chunkId]?.entities || chunkData.enrichment.entities || [];

            const newEntities = [...currentEntities];
            newEntities[index] = { ...newEntities[index], text: newText, type: newType };

            trackChange(chunkId, 'entities', newEntities);
            closeEntityModal();
            showMetadata(chunkId);
            
            // Rebuild the document content to reflect entity changes
            buildDocumentContent();
            setupEventListeners();
        }

        function exportAnnotations() {
            const exportData = {};

            for (const chunkId in changes) {
                const chunkData = allChunksData[chunkId];
                exportData[chunkId] = { ...chunkData, ...changes[chunkId] };
            }

            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute('href', dataStr);
            downloadAnchorNode.setAttribute('download', 'annotations_export.json');
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        function resetChanges() {
            if (confirm('Are you sure you want to reset all changes?')) {
                changes = {};
                updateChangeBadge();

                document.querySelectorAll('.chunk-boundary').forEach(el => {
                    el.classList.remove('edited');
                    const badge = el.querySelector('.edit-badge');
                    if (badge) badge.remove();
                });

                document.querySelectorAll('.nav-item').forEach(el => {
                    el.classList.remove('edited');
                });

                if (currentChunkId) {
                    showMetadata(currentChunkId);
                }
            }
        }

        // Start loading the data when the script loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadChunksData);
        } else {
            loadChunksData();
        }