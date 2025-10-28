// js/openNDJSON.js
class NDJSONHandler {
  constructor(filePath = 'assets/A_randomized_evaluation_of_the_Job_Training_Partnership_Act_20251018_184309_chunks.refined_enriched_v2.ndjson') {
    this.filePath = filePath;
    this.data = [];
    this.taxonomies = {};
    this.taxonomyCounts = {};
    this.usedColors = [];
    this.keyColorMap = {};
    
    // Define effect taxonomies
    this.EFFECT_TAXONOMIES = [
      'effect_direction',
      'effect_strength',
      'effect_horizon'
    ];
    
    // Extended color palette with more distinct colors
    this.colors = [
      // Original colors
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFBE0B", "#FB5607",
      "#8338EC", "#3A86FF", "#38B000", "#9EF01A", "#FF006E",
      "#D00000", "#00A896", "#028090", "#F48C06", "#6A4C93",
      "#606C38", "#283618", "#8E44AD", "#3498DB", "#E74C3C",
      "#2ECC71", "#F1C40F", "#E67E22", "#1ABC9C", "#9B59B6",
      "#34495E", "#16A085", "#C0392B", "#27AE60", "#2980B9",
      
      // Additional colors to support more categories
      "#8A2BE2", "#5F9EA0", "#D2691E", "#6495ED", "#DC143C",
      "#008B8B", "#B8860B", "#006400", "#8B008B", "#8B4513",
      "#2F4F4F", "#483D8B", "#2E8B57", "#8B0000", "#4B0082",
      "#9932CC", "#8B4513", "#2E8B57", "#DAA520", "#CD5C5C",
      "#4682B4", "#D2B48C", "#008080", "#D8BFD8", "#FF6347",
      "#40E0D0", "#EE82EE", "#F5DEB3", "#87CEEB", "#6B8E23"
    ];
    this.init();
  }

  async init() {
    try {
      console.log('Loading NDJSON file from:', this.filePath);
      
      // Check if the file exists using a HEAD request first
      try {
        const headResponse = await fetch(this.filePath, { method: 'HEAD' });
        if (!headResponse.ok) {
          throw new Error(`File not found or not accessible: ${this.filePath}`);
        }
      } catch (headError) {
        console.error('HEAD request failed:', headError);
        throw new Error(`Failed to access file at ${this.filePath}. Please check the file path and CORS settings.`);
      }
      
      // Load and process the file
      await this.loadNdjsonFile(this.filePath);
      const result = this.index();
      console.log('Successfully processed data:', result);
      return result;
    } catch (error) {
      console.error('Error initializing NDJSON handler:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

  async loadNdjsonFile(filePath) {
    try {
      console.log(`Attempting to load file from: ${filePath}`);
      
      // Check if the file exists using a HEAD request first
      try {
        const headResponse = await fetch(filePath, { method: 'HEAD' });
        if (!headResponse.ok) {
          throw new Error(`File not found or not accessible: ${filePath}`);
        }
      } catch (headError) {
        console.error('HEAD request failed:', headError);
        throw new Error(`Failed to access file at ${filePath}. Please check the file path and CORS settings.`);
      }
      
      // If HEAD request succeeds, proceed with GET
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      if (!text || text.trim() === '') {
        throw new Error('File is empty');
      }
      
      const lines = text.split('\n').filter(line => line.trim() !== '');
      console.log(`Found ${lines.length} lines in file`);

      if (lines.length === 0) {
        throw new Error('No valid data found in file - file appears to be empty');
      }

      this.data = [];
      const errors = [];
      
      for (let i = 0; i < lines.length; i++) {
        try {
          const parsed = JSON.parse(lines[i]);
          this.data.push(parsed);
          if (i < 3) { // Log first 3 items for debugging
            console.log(`Line ${i + 1} data:`, JSON.stringify(parsed, null, 2));
          }
        } catch (e) {
          const errorMsg = `JSON parse error at line ${i + 1}: ${e.message}`;
          console.warn(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Successfully parsed ${this.data.length} items (${errors.length} errors)`);
      
      if (errors.length > 0) {
        console.warn('Encountered errors while parsing:', errors);
      }
      
      if (this.data.length === 0) {
        throw new Error('No valid JSON objects could be parsed from the file');
      }
      
      if (this.data[0].enrichment) {
        console.log('First item enrichment data:', JSON.stringify(this.data[0].enrichment, null, 2));
      } else {
        console.warn('No enrichment data found in the first item. Available keys:', Object.keys(this.data[0]));
      }

      return this.data;
    } catch (error) {
      console.error('Error loading NDJSON file:', error);
      throw error;
    }
  }

  index() {
    const lines = this.data.map(line => {
      line.pruned_taxonomy = [];
      line.pruned_taxonomy_details = [];

      if (line.enrichment?.taxonomy || line.enrichment?.taxonomyDetails) {
        const aggregatedTaxonomies = this.aggregatedTaxonomies();

        // Process taxonomy
        if (line.enrichment?.taxonomy) {
          aggregatedTaxonomies.forEach(taxonomy => {
            const keyParts = taxonomy.key.split('.');
            const firstPart = keyParts[0];
            const lastPart = keyParts[keyParts.length - 1];
            const normalizedLastPart = lastPart.toLowerCase();

            let terms = [];

            // Handle effect_* taxonomies
            if (this.EFFECT_TAXONOMIES.includes(firstPart) &&
                line.enrichment.taxonomy[firstPart] &&
                line.enrichment.taxonomy[firstPart].toLowerCase() === normalizedLastPart) {
              terms = [lastPart.toLowerCase()];
            } else {
              // Handle other taxonomies, including nested ones like target_groups.labour_market_status
              let taxonomyValue = null;
              if (firstPart === 'target_groups' && keyParts.length > 2) {
                // Handle nested target_groups.labour_market_status
                const nestedKey = keyParts.slice(0, 2).join('.'); // e.g., target_groups.labour_market_status
                if (line.enrichment.taxonomy[nestedKey]) {
                  taxonomyValue = line.enrichment.taxonomy[nestedKey];
                }
              } else if (line.enrichment.taxonomy[firstPart]) {
                taxonomyValue = line.enrichment.taxonomy[firstPart];
              }

              if (taxonomyValue !== null) {
                const values = Array.isArray(taxonomyValue) ? taxonomyValue : [taxonomyValue];
                values.forEach(value => {
                  if (typeof value === 'string') {
                    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]+/gi, '_');
                    if (normalizedValue === normalizedLastPart) {
                      terms.push(value); // Keep original value (e.g., long_term_unemployed)
                    }
                  }
                });
              }
            }

            if (terms.length > 0) {
              // For the main taxonomy, only keep the value from taxonomy details
              let finalTerms = [];
              if (line.enrichment.taxonomyDetails) {
                const keyParts = taxonomy.key.split('.');
                const lastPart = keyParts[keyParts.length - 1];
                
                // Look for matching details
                Object.entries(line.enrichment.taxonomyDetails).forEach(([detailKey, detailValues]) => {
                  if (detailKey.toLowerCase() === lastPart.toLowerCase()) {
                    const detailTerms = this.flatten(detailValues)
                      .filter(item => typeof item === 'string' && isNaN(item))
                      .map(item => item.toLowerCase().trim());
                    finalTerms = [...finalTerms, ...detailTerms];
                  }
                });
              }
              
              // If no details found, keep the original terms
              if (finalTerms.length === 0) {
                finalTerms = terms;
              }
              
              line.pruned_taxonomy.push({
                key: taxonomy.key,
                label: this.formatLabel(taxonomy.key),
                color: taxonomy.color,
                terms: [...new Set(finalTerms)]
              });
            }
          });
        }

        // Process taxonomyDetails
        if (line.enrichment?.taxonomyDetails) {
          Object.entries(line.enrichment.taxonomyDetails).forEach(([detailKey, detailValues]) => {
            const normalizedDetailKey = detailKey.toLowerCase().replace(/[^a-z0-9]+/gi, '_');
            const detailTerms = this.flatten(detailValues)
              .filter(item => typeof item === 'string' && isNaN(item))
              .map(item => item.toLowerCase());

            // Find matching taxonomy in aggregatedTaxonomies
            let targetKey = null;
            let targetColor = null;
            for (const taxonomy of aggregatedTaxonomies) {
              const keyParts = taxonomy.key.split('.');
              const lastPart = keyParts[keyParts.length - 1];
              const normalizedLastPart = lastPart.toLowerCase();
              if (normalizedDetailKey === normalizedLastPart || 
                  (detailKey === 'geography_levels' && taxonomy.key === 'geography_levels.regional')) {
                targetKey = taxonomy.key;
                targetColor = taxonomy.color;
                break;
              }
            }

            if (targetKey) {
              // Merge with existing pruned_taxonomy entry if it exists
              const existingIndex = line.pruned_taxonomy.findIndex(item => item.key === targetKey);
              if (existingIndex !== -1) {
                line.pruned_taxonomy[existingIndex].terms = [
                  ...new Set([...line.pruned_taxonomy[existingIndex].terms, ...detailTerms])
                ];
              } else {
                line.pruned_taxonomy_details.push({
                  key: targetKey,
                  label: this.formatLabel(targetKey),
                  color: targetColor,
                  terms: detailTerms
                });
              }
            }
          });
        }
      }

      // Merge pruned_taxonomy and pruned_taxonomy_details into enrichment
      if (line.enrichment) {
        line.enrichment.taxonomies = [
          ...(line.pruned_taxonomy || []),
          ...(line.pruned_taxonomy_details || [])
        ];
      }

      // Clean up individual arrays and remove original taxonomy data
      delete line.pruned_taxonomy;
      delete line.pruned_taxonomy_details;
      delete line._hash;
      delete line.chunk_id;
      delete line.header;
      delete line.start;
      delete line.end;
      delete line.links;

      if (line.enrichment && Object.keys(line.enrichment).length === 0) {
        delete line.enrichment;
      }

      if (line.enrichment) {
        delete line.enrichment.title;
        delete line.enrichment.summary;
        delete line.enrichment.keywords;
        delete line.enrichment.entities;
        delete line.enrichment.rhetorical_role;
        delete line.enrichment.temporal;
        delete line.enrichment.geography;
        delete line.enrichment.taxonomy;
        delete line.enrichment.taxonomyDetails;
        delete line.enrichment._verifier_audit;
      }

      delete line.prev_enrichment;
      delete line._run_id;

      return line;
    });

    return {
      statistics: {
        total_lines: lines.length,
        total_taxonomies: this.aggregatedTaxonomies().length,
        total_terms: this.aggregatedTaxonomies().reduce((sum, t) => sum + t.count, 0),
        ...this.aggregatedStatistics(lines)
      },
      dataset: {
        taxonomies: this.aggregatedTaxonomies(),
        lines: lines
      }
    };
  }

  aggregatedTaxonomies() {
    // Only reset taxonomies if they haven't been processed yet
    if (Object.keys(this.taxonomies).length === 0) {
      this.taxonomyCounts = {};
      
      // First pass: process all taxonomies to build the complete list
      this.data.forEach(item => {
        if (!item || !item.enrichment) {
          return;
        }

        // Process both taxonomy and taxonomyDetails
        if (item.enrichment.taxonomy) {
          this.processNestedArray(item.enrichment.taxonomy);
        }
      });

      // Second pass: count occurrences of each taxonomy
      this.data.forEach(item => {
        if (!item || !item.enrichment) {
          return;
        }

        if (item.enrichment.taxonomy) {
          this.countTaxonomyOccurrences(item.enrichment.taxonomy);
        }
      });

      // Ensure all taxonomies have a count field
      Object.keys(this.taxonomies).forEach(key => {
        if (!this.taxonomies[key].count) {
          this.taxonomies[key].count = 0;
        }
      });
    }

    return Object.values(this.taxonomies);
  }

  aggregatedStatistics(lines) {
    const tokenStats = {
      document_title: null,
      document_timestamp: null,
      document_words: 0,
      document_sentences: 0,
      model: null,
      confidence: 0,
      tokens: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      tokens_average_per_request: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      },
      token_usage_percentage: {
        prompt: 0,
        completion: 0
      }
    };
    
    let validRequests = 0;
    
    lines.forEach(line => {
      // Set the document title once (it should be the same for all lines)
      if (tokenStats.document_title === null && line.doc) {
        let title = line.doc.replace(/[_\.]/g, ' ');
        title = title.replace(/\s+/g, ' '); // Replace multiple spaces with single space
        tokenStats.document_title = this.limitString(title.trim(), 100);
      }

      // Set the document timestamp once (it should be the same for all lines)
      if (tokenStats.document_timestamp === null && line._ts) {
        tokenStats.document_timestamp = new Date(line._ts).toISOString().replace('T', ' ').substring(0, 19);
      }

      // Set the document word count
      if (line.meta?.words) {
        tokenStats.document_words += line.meta.words;
      }

      // Set the document sentence count
      if (line.meta?.sentences) {
        tokenStats.document_sentences += line.meta.sentences;
      }

      // Set the confidence
      if (line.enrichment?.confidence) {
        const confidence = line.enrichment.confidence;
        if (!isNaN(confidence)) {
          tokenStats.confidence += parseFloat(confidence);
        }
      }

      if (line.enrichment?._usage && line.enrichment?._model && typeof line.enrichment._usage === 'object') {
        const usage = line.enrichment._usage;
        
        // Set the model name once (it should be the same for all lines)
        if (tokenStats.model === null) {
          tokenStats.model = line.enrichment._model;
        }
        
        // Skip if required fields are missing
        if (!usage.prompt_tokens || !usage.completion_tokens || !usage.total_tokens) {
          validRequests++;
          return;
        }
        
        tokenStats.tokens.prompt_tokens += parseInt(usage.prompt_tokens);
        tokenStats.tokens.completion_tokens += parseInt(usage.completion_tokens);
        tokenStats.tokens.total_tokens += parseInt(usage.total_tokens);
      }

      validRequests++;
    });
    
    // Calculate averages
    if (validRequests > 0) {
      // Calculate the average confidence
      const average = validRequests > 0 ? tokenStats.confidence / validRequests : 0;
      tokenStats.confidence = Math.round(average * 100 * 100) / 100; // Convert to percentage with 2 decimal places

      tokenStats.tokens_average_per_request = {
        prompt_tokens: Math.round((tokenStats.tokens.prompt_tokens / validRequests) * 100) / 100,
        completion_tokens: Math.round((tokenStats.tokens.completion_tokens / validRequests) * 100) / 100,
        total_tokens: Math.round((tokenStats.tokens.total_tokens / validRequests) * 100) / 100
      };
      
      // Calculate token usage percentages
      const totalTokens = tokenStats.tokens.total_tokens;
      if (totalTokens > 0) {
        tokenStats.token_usage_percentage = {
          prompt: Math.round((tokenStats.tokens.prompt_tokens / totalTokens) * 100 * 100) / 100,
          completion: Math.round((tokenStats.tokens.completion_tokens / totalTokens) * 100 * 100) / 100
        };
      }
    }
    
    return tokenStats;
  }

  processNestedArray(data, prefix = '') {
    if (!data) {
      console.warn('processNestedArray called with null/undefined data');
      return;
    }
    
    console.log(`Processing nested array with prefix: ${prefix}`, data);
    
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        console.warn(`Skipping null/undefined value for key: ${key}`);
        return;
      }
      
      const currentKey = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        console.log(`Found array at ${currentKey} with ${value.length} items`);
        if (this.isAssoc(value)) {
          console.log(`Processing as associative array: ${currentKey}`);
          this.processNestedArray(value, currentKey);
        } else {
          console.log(`Processing as taxonomy items: ${currentKey}`, value);
          this.processTaxonomyItems(value, currentKey);
        }
      } else if (typeof value === 'object') {
        console.log(`Processing object at: ${currentKey}`);
        this.processNestedArray(value, currentKey);
      } else if (typeof value === 'string' && isNaN(value)) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/gi, '_');
        const taxonomyKey = `${currentKey}.${slug}`;
        console.log(`Processing string value at ${currentKey}: ${value} -> ${taxonomyKey}`);
        if (!this.taxonomies[taxonomyKey]) {
          console.log(`Adding new taxonomy: ${taxonomyKey}`);
          this.taxonomies[taxonomyKey] = {
            key: taxonomyKey,
            label: this.formatLabel(taxonomyKey),
            color: this.getUniqueColor(taxonomyKey),
            count: 0
          };
        } else {
          console.log(`Taxonomy already exists: ${taxonomyKey}`);
        }
      } else {
        console.log(`Skipping ${typeof value} at ${currentKey}:`, value);
      }
    });
    
    console.log(`Finished processing ${prefix}, total taxonomies: ${Object.keys(this.taxonomies).length}`);
  }

  countTaxonomyOccurrences(taxonomy, prefix = '') {
    Object.entries(taxonomy).forEach(([key, value]) => {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        if (this.isAssoc(value)) {
          this.countTaxonomyOccurrences(value, currentKey);
        } else {
          value.forEach(item => {
            if (item) {
              const slug = typeof item === 'string' ? item.toLowerCase().replace(/[^a-z0-9]+/gi, '_') : '';
              const taxKey = `${currentKey}.${slug}`;
              if (this.taxonomies[taxKey]) {
                this.taxonomies[taxKey].count++;
              }
            }
          });
        }
      } else if (typeof value === 'object' && value !== null) {
        this.countTaxonomyOccurrences(value, currentKey);
      } else if (typeof value === 'string' && isNaN(value)) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/gi, '_');
        const taxKey = `${currentKey}.${slug}`;
        if (this.taxonomies[taxKey]) {
          this.taxonomies[taxKey].count++;
        }
      }
    });
  }

  processTaxonomyItems(items, category) {
    items.forEach(item => {
      if (!item) {
        return;
      }

      const slug = typeof item === 'string' ? item.toLowerCase().replace(/[^a-z0-9]+/gi, '_') : '';
      const key = `${category}.${slug}`;

      if (!this.taxonomies[key]) {
        const color = this.getUniqueColor(key);
        
        this.taxonomies[key] = {
          key: key,
          label: this.formatLabel(key),
          color: color,
          count: 0
        };
      }
    });
  }

  getUniqueColor(key) {
    // Check if the key already has an assigned color
    if (this.keyColorMap[key]) {
      return this.keyColorMap[key];
    }

    // Try to find an unused color in the palette
    for (const color of this.colors) {
      if (!this.usedColors.includes(color)) {
        this.usedColors.push(color);
        this.keyColorMap[key] = color;
        return color;
      }
    }

    // If all colors are used, try to find a color with acceptable brightness
    const crc32 = this.crc32(key);
    let colorIndex = Math.abs(crc32) % this.colors.length;
    let attempts = 0;
    const maxAttempts = Math.min(20, this.colors.length); // Limit attempts to prevent performance issues

    while (attempts < maxAttempts) {
      const color = this.colors[colorIndex];
      const brightness = this.calculateBrightness(color);
      
      // Be more lenient with brightness check
      if (brightness <= 220) { // Increased from 200 to 220 to allow more colors
        this.usedColors.push(color);
        this.keyColorMap[key] = color;
        return color;
      }

      colorIndex = (colorIndex + 1) % this.colors.length;
      attempts++;
    }

    // If no suitable color found, generate a random one with controlled brightness
    const color = this.generateRandomColor();
    this.usedColors.push(color);
    this.keyColorMap[key] = color;
    console.warn(`No suitable color available in palette for key: ${key}. Using generated color: ${color}`);
    return color;
  }

  generateRandomColor() {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
      const brightness = this.calculateBrightness(color);

      if (brightness <= 200 && !this.usedColors.includes(color)) {
        return color;
      }

      attempts++;
    }

    console.warn(`Could not generate a suitable random color after ${maxAttempts} attempts. Using fallback color.`);
    return "#333333";
  }

  calculateBrightness(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  formatLabel(key) {
    if (!key) return 'Untitled';
    if (typeof key !== 'string') {
      console.warn('formatLabel called with non-string key:', key);
      return 'Untitled';
    }
    
    const parts = key.split('.');
    if (parts.length === 0) return key;
    
    // Handle case where the last part might be undefined
    const lastPart = parts[parts.length - 1] ? parts[parts.length - 1].replace(/_/g, ' ') : key;
    
    try {
      // Handle effect-related taxonomies
      if (this.EFFECT_TAXONOMIES && Array.isArray(this.EFFECT_TAXONOMIES) && parts[0]) {
        if (this.EFFECT_TAXONOMIES.includes(parts[0])) {
          const effectType = parts[0].replace(/_/g, ' ');
          // For effect types, we want "value, effect type" format
          return `${lastPart}, ${effectType}`.trim();
        }
      }
      
      // For non-effect taxonomies, use the original format: "last part, parent1, parent2, ..."
      const parentParts = parts.slice(0, -1);
      const parentSegments = parentParts
        .filter(part => part && typeof part === 'string' && part.trim() !== '')
        .map(part => part.replace(/_/g, ' '));
      
      // Combine the last part with parent segments
      const parentContext = parentSegments.length > 0 ? `, ${parentSegments.join(', ')}` : '';
      return `${lastPart}${parentContext}`.trim();
    } catch (error) {
      console.error('Error formatting label for key:', key, error);
      return key || 'Untitled';
    }
  }

  limitString(str, limit) {
    if (str.length <= limit) {
      return str;
    }
    return str.substring(0, limit) + '...';
  }

  crc32(str) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ this.crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  get crc32Table() {
    if (!this._crc32Table) {
      this._crc32Table = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        this._crc32Table[n] = c;
      }
    }
    return this._crc32Table;
  }

  isAssoc(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return false;
    return arr.some((_, i) => arr[i] === undefined || !(i in arr));
  }

  flatten(arr) {
    const result = [];
    const flat = (items) => {
      items.forEach(item => {
        if (Array.isArray(item)) {
          flat(item);
        } else {
          result.push(item);
        }
      });
    };
    flat(arr);
    return result;
  }
}