// js/transformer.js

/**
 * Transformer for processing NDJSON data and dynamically generating taxonomy information
 */

/**
 * Generates a color based on a string hash
 * @param {string} str - Input string
 * @returns {string} Hex color code
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate pastel colors
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 65%)`;
}

/**
 * Extracts the first letter of each word in a string
 * @param {string} str - Input string
 * @returns {string} First letters of each word
 */
function getPrefix(str) {
    return str
        .split('_')
        .map(word => word[0]?.toUpperCase() || '')
        .join('')
        .substring(0, 2);
}

/**
 * Processes a single NDJSON line and extracts taxonomy information
 * @param {string} line - A single line from the NDJSON file
 * @param {Object} taxonomyMap - Map to store taxonomy information
 * @returns {Object} Updated taxonomy map
 */
function processLine(line, taxonomyMap = {}) {
    try {
        const data = JSON.parse(line);
        
        if (data.enrichment?.taxonomy) {
            const { taxonomy } = data.enrichment;
            
            for (const [category, items] of Object.entries(taxonomy)) {
                if (!Array.isArray(items)) continue;
                
                if (!taxonomyMap[category]) {
                    // Create new taxonomy entry if it doesn't exist
                    taxonomyMap[category] = {
                        id: category.toLowerCase().replace(/_/g, '-'),
                        name: category.split('_')
                                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                   .join(' '),
                        prefix: getPrefix(category),
                        color: stringToColor(category),
                        count: 0
                    };
                }
                
                // Update count for this taxonomy
                taxonomyMap[category].count += items.length;
            }
        }
    } catch (error) {
        console.error('Error processing line:', error);
    }
    
    return taxonomyMap;
}

/**
 * Transforms NDJSON data into a structured taxonomy array
 * @param {string} ndjson - The complete NDJSON content as a string
 * @returns {Array} Array of taxonomy objects with counts
 */
function transformNdjsonToTaxonomies(ndjson) {
    const taxonomyMap = {};
    
    // Split the NDJSON into lines and process each line
    const lines = ndjson.split('\n').filter(line => line.trim() !== '');
    lines.forEach(line => processLine(line, taxonomyMap));
    
    // Convert the taxonomy map to an array and sort by count (descending)
    return Object.values(taxonomyMap).sort((a, b) => b.count - a.count);
}

/**
 * Fetches and processes the NDJSON file
 * @param {string} filePath - Path to the NDJSON file
 * @returns {Promise<Array>} Promise that resolves to the processed taxonomies
 */
async function fetchAndProcessTaxonomies(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const ndjson = await response.text();
        return transformNdjsonToTaxonomies(ndjson);
    } catch (error) {
        console.error('Error fetching or processing taxonomies:', error);
        return []; // Return empty array in case of error
    }
}

// Example usage:
// fetchAndProcessTaxonomies('./assets/AI_ADOPTION_IN_THE_PUBLIC_SECTOR_concepts_full_enriched.ndjson')
//     .then(taxonomies => {
//         console.log('Processed taxonomies:', taxonomies);
//         return taxonomies;
//     });

// Export for use in other modules
export {
    transformNdjsonToTaxonomies,
    fetchAndProcessTaxonomies
};