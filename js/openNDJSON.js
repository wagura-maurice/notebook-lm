// js/openNDJSON.js
class NDJSONHandler {
  constructor(filePath = null) {
    this.filePath = filePath || 'assets/What_Can_Active_Labour_Market_Policy_Do_20251015_131625_chunks.refined_enriched_v2.ndjson';
    this.colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFBE0B", "#FB5607",
      "#8338EC", "#3A86FF", "#38B000", "#9EF01A", "#FF006E",
      "#D00000", "#00A896", "#028090", "#F48C06", "#6A4C93",
      "#606C38", "#283618", "#8E44AD", "#3498DB", "#E74C3C",
      "#2ECC71", "#F1C40F", "#E67E22", "#1ABC9C", "#9B59B6",
      "#34495E", "#16A085", "#C0392B", "#27AE60", "#2980B9",
      // Add more colors to reduce the chance of running out
      "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6",
      "#EF4444", "#14B8A6", "#F97316", "#8B5CF6", "#EC4899"
    ];
    this.taxonomies = {};
    this.usedColors = [];
    this.keyColorMap = {};
    this.data = [];
    // Don't call init here, let the consumer handle the promise
  }

  async init() {
    try {
      await this.loadNdjsonFile(this.filePath);
      const result = this.index();
      return result;
    } catch (error) {
      throw error; // Re-throw to allow handling by the caller
    }
  }

  async loadNdjsonFile(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`NDJSON file not found: ${filePath}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');

      this.data = lines
        .map((line, index) => {
          try {
            return JSON.parse(line);
          } catch (error) {
            throw error;
          }
        })
        .filter(item => item !== null);

      if (this.data.length === 0) {
        throw new Error('No valid data found in file');
      }

      return this.data;
    } catch (error) {
      throw error;
    }
  }

  index() {
    // First, collect all taxonomies from all lines
    const aggregatedTaxonomies = this.aggregatedTaxonomies();
    
    // Then process each line
    const lines = this.data.map(line => {
      // Create a deep copy of the line to avoid mutating original data
      const lineCopy = JSON.parse(JSON.stringify(line));
      
      // Initialize arrays if they don't exist
      if (!lineCopy.pruned_taxonomy) lineCopy.pruned_taxonomy = [];
      if (!lineCopy.pruned_taxonomy_details) lineCopy.pruned_taxonomy_details = [];

      if (lineCopy.enrichment?.taxonomy || lineCopy.enrichment?.taxonomyDetails) {
        // Process taxonomy
        if (lineCopy.enrichment?.taxonomy) {
          aggregatedTaxonomies.forEach(taxonomy => {
            const keyParts = taxonomy.key.split('.');
            const firstPart = keyParts[0];
            const lastPart = keyParts[keyParts.length - 1];
            const normalizedLastPart = lastPart.toLowerCase();

            let terms = [];
            
            // Ensure taxonomy has the required properties
            if (!taxonomy.key || !taxonomy.color) {
              throw new Error('Invalid taxonomy format'); // return; // Skip this taxonomy if it's invalid
            }

            // Handle effect_* taxonomies
            if (['effect_direction', 'effect_strength', 'effect_horizon'].includes(firstPart) &&
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
              if (lineCopy.enrichment?.taxonomyDetails) {
                const keyParts = taxonomy.key.split('.');
                const lastPart = keyParts[keyParts.length - 1];
                
                // Look for matching details
                Object.entries(lineCopy.enrichment.taxonomyDetails || {}).forEach(([detailKey, detailValues]) => {
                  if (detailKey.toLowerCase() === lastPart.toLowerCase()) {
                    const detailTerms = this.flatten(Array.isArray(detailValues) ? detailValues : [detailValues])
                      .filter(item => item !== null && typeof item === 'string' && isNaN(item))
                      .map(item => item.toLowerCase().trim())
                      .filter(Boolean); // Remove any empty strings
                    finalTerms = [...finalTerms, ...detailTerms];
                  }
                });
              }
              
              // Initialize pruned_taxonomy and pruned_taxonomy_details if they don't exist
              if (!lineCopy.pruned_taxonomy) lineCopy.pruned_taxonomy = [];
              if (!lineCopy.pruned_taxonomy_details) lineCopy.pruned_taxonomy_details = [];

              // If no details found, keep the original terms
              if (finalTerms.length === 0) {
                finalTerms = terms;
              }
              
              // Add the processed taxonomy to the line data
              lineCopy.pruned_taxonomy.push({
                key: taxonomy.key,
                color: taxonomy.color,
                terms: [...new Set(finalTerms)]
              });
            }
          });
        }

        // Process taxonomyDetails
        if (lineCopy.enrichment?.taxonomyDetails) {
          Object.entries(lineCopy.enrichment.taxonomyDetails).forEach(([detailKey, detailValues]) => {
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
              // Ensure pruned_taxonomy and pruned_taxonomy_details are initialized
              if (!lineCopy.pruned_taxonomy) lineCopy.pruned_taxonomy = [];
              if (!lineCopy.pruned_taxonomy_details) lineCopy.pruned_taxonomy_details = [];
              
              const existingIndex = lineCopy.pruned_taxonomy.findIndex(item => item.key === targetKey);
              if (existingIndex !== -1) {
                lineCopy.pruned_taxonomy[existingIndex].terms = [
                  ...new Set([...lineCopy.pruned_taxonomy[existingIndex].terms, ...detailTerms])
                ];
              } else {
                lineCopy.pruned_taxonomy_details.push({
                  key: targetKey,
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

      // Clean up the line data
      const cleanLine = {...lineCopy};
      
      // Keep only the processed taxonomies in the enrichment
      if (cleanLine.enrichment) {
        cleanLine.enrichment = {
          ...cleanLine.enrichment,
          taxonomies: [
            ...(cleanLine.pruned_taxonomy || []),
            ...(cleanLine.pruned_taxonomy_details || [])
          ]
        };
        
        // Clean up other enrichment data we don't need
        const { 
          title, summary, keywords, entities, rhetorical_role, 
          temporal, geography, taxonomy, taxonomyDetails, 
          confidence, _usage, _model, _verifier_audit, 
          ...restEnrichment 
        } = cleanLine.enrichment;
        
        cleanLine.enrichment = restEnrichment;
      }
      
      // Remove other unused fields
      const {
        _hash, doc, chunk_id, header, start, end, text, links,
        prev_enrichment, meta, _run_id, _ts,
        ...restLine
      } = cleanLine;
      
      return restLine;
    });

    return {
      taxonomies: aggregatedTaxonomies,
      lines: lines
    };
  }

  aggregatedTaxonomies() {
    this.taxonomies = {};
    this.usedColors = [];
    this.keyColorMap = {};
    
    this.data.forEach((item, index) => {
      if (!item || !item.enrichment) {
        return;
      }

      // Process taxonomy if it exists
      if (item.enrichment.taxonomy) {
        this.processNestedArray(item.enrichment.taxonomy);
      }
    });

    const taxonomyList = Object.values(this.taxonomies);
    return taxonomyList;
  }

  processNestedArray(data, prefix = '') {
    Object.entries(data).forEach(([key, value]) => {
      const currentKey = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        if (this.isAssoc(value)) {
          this.processNestedArray(value, currentKey);
        } else {
          this.processTaxonomyItems(value, currentKey);
        }
      } else if (typeof value === 'object' && value !== null) {
        this.processNestedArray(value, currentKey);
      } else if (typeof value === 'string' && isNaN(value)) {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/gi, '_');
        const taxonomyKey = `${currentKey}.${slug}`;
        if (!this.taxonomies[taxonomyKey]) {
          this.taxonomies[taxonomyKey] = {
            key: taxonomyKey,
            color: this.getUniqueColor(taxonomyKey)
          };
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
          color: color
        };
      }
    });
  }

  getUniqueColor(key) {
    // Check if the key already has an assigned color
    if (this.keyColorMap[key]) {
      return this.keyColorMap[key];
    }

    // First, try to find an unused color from the palette
    for (const color of this.colors) {
      if (!this.usedColors.includes(color)) {
        const brightness = this.calculateBrightness(color);
        if (brightness <= 200) {
          this.usedColors.push(color);
          this.keyColorMap[key] = color;
          return color;
        }
      }
    }

    // If all colors are used, generate a new random color
    const color = this.generateRandomColor();
    this.usedColors.push(color);
    this.keyColorMap[key] = color;
    return color;
  }

  generateRandomColor() {
    // Generate a color with good contrast (not too bright)
    const r = Math.floor(Math.random() * 180); // Limit red to darker shades
    const g = Math.floor(Math.random() * 180); // Limit green to darker shades
    const b = Math.floor(Math.random() * 55) + 200; // Keep blue brighter for contrast
    
    // Rotate the color components to get more variety
    const components = [r, g, b];
    const rotation = Math.floor(Math.random() * 3);
    const rotated = [...components.slice(rotation), ...components.slice(0, rotation)];
    
    const color = `#${rotated[0].toString(16).padStart(2, '0')}${rotated[1].toString(16).padStart(2, '0')}${rotated[2].toString(16).padStart(2, '0')}`.toUpperCase();
    
    // If we've used too many colors, start reusing them in a round-robin fashion
    if (this.usedColors.length > 50) {
      const index = (this.usedColors.length - 50) % this.usedColors.length;
      return this.usedColors[index];
    }
    
    return color;
  }

  calculateBrightness(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
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
    return arr.some((_, i) => arr[i] === undefined || i in arr === false);
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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const handler = new NDJSONHandler();
    await handler.init();
    // Your code that depends on the handler being initialized
  } catch (error) {
    throw error;
  }
});