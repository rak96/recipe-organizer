import { CohereClient } from 'cohere-ai';
import { NextRequest, NextResponse } from 'next/server';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});



// Fallback function to create a basic shopping list from recipe name
function createFallbackShoppingList(recipeName: string): any {
  return {
    "Pantry/Dry Goods": [
      { "ingredient": "basic ingredients", "quantity": "as needed" }
    ],
    "Produce": [
      { "ingredient": "fresh ingredients", "quantity": "as needed" }
    ],
    "Note": `Please check the original recipe for "${recipeName}" for exact ingredients and quantities.`
  };
}

// Helper function to try parsing with smart cleaning
function tryParseWithCleaning(text: string): any {
  // Clean common formatting issues
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Remove any trailing explanatory text after JSON
  const lines = cleaned.split('\n');
  let jsonEndIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('}')) {
      jsonEndIndex = i;
      break;
    }
  }
  if (jsonEndIndex !== -1) {
    cleaned = lines.slice(0, jsonEndIndex + 1).join('\n');
  }
  
  // Fix array-as-root issue: [ "key": [...] ] → { "key": [...] }
  if (cleaned.startsWith('[') && cleaned.includes('":')) {
    cleaned = cleaned.replace(/^\s*\[\s*/, '{').replace(/\s*\]\s*$/, '}');
  }
  
  // Remove any remaining leading array brackets
  cleaned = cleaned.replace(/^\s*\[\s*/, '');
  
  // Extract object if wrapped in extra content
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    cleaned = objectMatch[0];
  }
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/([^\\])'/g, '$1"') // Fix single quotes
    .replace(/,+/g, ','); // Fix multiple commas
  
  return JSON.parse(cleaned);
}

// Helper function to normalize aisle names and structure
function normalizeShoppingList(rawData: any): any {
  const aisleMapping: { [key: string]: string } = {
    'produce': 'Produce',
    'dairy': 'Dairy', 
    'meat_and_seafood': 'Meat & Seafood',
    'meat & seafood': 'Meat & Seafood',
    'pantry': 'Pantry/Dry Goods',
    'pantry/dry goods': 'Pantry/Dry Goods',
    'frozen': 'Frozen Foods',
    'frozen foods': 'Frozen Foods',
    'bakery': 'Bakery',
    'canned': 'Canned Goods',
    'canned goods': 'Canned Goods',
    'condiments': 'Condiments & Sauces',
    'condiments & sauces': 'Condiments & Sauces',
    'spices': 'Spices & Seasonings',
    'spices & seasonings': 'Spices & Seasonings',
    'beverages': 'Beverages'
  };

  const normalized: any = {};
  
  // Initialize all expected aisles
  Object.values(aisleMapping).forEach(aisle => {
    normalized[aisle] = [];
  });
  
  // Process the raw data
  Object.keys(rawData).forEach(key => {
    const normalizedKey = aisleMapping[key.toLowerCase()] || key;
    let items = rawData[key];
    
    // Handle nested arrays: [[{...}]] → [{...}]
    if (Array.isArray(items) && items.length > 0 && Array.isArray(items[0])) {
      items = items.flat();
    }
    
    // Ensure it's an array
    if (!Array.isArray(items)) {
      items = [];
    }
    
    // Normalize each item
    const normalizedItems = items.map((item: any) => {
      if (typeof item === 'string') {
        return { ingredient: item, quantity: '1' };
      }
      return {
        ingredient: item.ingredient || 'Unknown item',
        quantity: String(item.quantity || '1')
      };
    }).filter((item: any) => item.ingredient !== 'Unknown item');
    
    normalized[normalizedKey] = normalizedItems;
  });
  
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const { recipeName } = await request.json();

    if (!recipeName) {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: 400 }
      );
    }

    const prompt = `Generate a shopping list for "${recipeName}" organized by supermarket aisle.

Create a comprehensive shopping list with ingredients organized by grocery store sections. Include reasonable quantities for each ingredient.

Available aisles: Produce, Dairy, Meat & Seafood, Pantry/Dry Goods, Frozen Foods, Bakery, Canned Goods, Condiments & Sauces, Spices & Seasonings, Beverages.

Recipe: ${recipeName}

Return a JSON object with aisle names as keys and arrays of ingredient objects as values. Each ingredient should have "ingredient" and "quantity" fields.`;

    // STRATEGY 1: Try fast model with multiple attempts
    console.log('Attempting fast model with multiple tries...');
    const overallStartTime = Date.now();
    
    // Try up to 3 fast attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🚀 Fast model attempt ${attempt}/3...`);
      const attemptStartTime = Date.now();
      
      try {
        const fastResponse = await cohere.chat({
          model: 'command-light',
          message: prompt,
          maxTokens: 800,
          temperature: attempt === 1 ? 0.1 : 0.3, // Slightly more creativity on retries
        });

        let generatedText = fastResponse.text.trim();
        console.log(`Attempt ${attempt} response time: ${Date.now() - attemptStartTime}ms`);
        console.log(`Raw attempt ${attempt} response:`, generatedText.substring(0, 200) + '...');
        
        // Try to parse the fast response
        let parsedData = tryParseWithCleaning(generatedText);
        
        // Validate the structure
        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('Fast response is not a valid object');
        }
        
        // Normalize the shopping list structure and aisle names
        const organizedIngredients = normalizeShoppingList(parsedData);
        
        // Check if we have valid items
        const hasValidItems = Object.values(organizedIngredients).some(
          (items: any) => Array.isArray(items) && items.length > 0
        );
        
        if (hasValidItems) {
          console.log(`✅ Fast model succeeded on attempt ${attempt}!`);
          return NextResponse.json({ 
            organizedIngredients,
            modelUsed: `command-light (attempt ${attempt})`,
            responseTime: Date.now() - overallStartTime,
            totalAttempts: attempt
          });
        } else {
          throw new Error('No valid items found in fast response');
        }
        
      } catch (attemptError) {
        console.log(`❌ Fast model attempt ${attempt} failed:`, attemptError);
        if (attempt === 3) {
          console.log('🔧 All fast attempts failed. Trying JSON cleanup strategy...');
        }
      }
    }

    // STRATEGY 2: JSON Cleanup with fast model
    console.log('🔧 Attempting JSON cleanup with fast model...');
    const cleanupStartTime = Date.now();
    
    try {
      // Get the raw text from the last attempt and ask the fast model to clean it up
      const cleanupPrompt = `Convert the following text into a valid JSON object for a shopping list. The JSON should have grocery store aisle names as keys (like "Produce", "Dairy", "Meat & Seafood", etc.) and arrays of ingredient objects as values. Each ingredient should have "ingredient" and "quantity" fields.

Fix any formatting issues, nested arrays, incorrect property names, or syntax errors. Return ONLY valid JSON:

Recipe: ${recipeName}

Expected format:
{
  "Produce": [{"ingredient": "Tomatoes", "quantity": "2"}],
  "Dairy": [{"ingredient": "Milk", "quantity": "1 gallon"}]
}`;

      const cleanupResponse = await cohere.chat({
        model: 'command-light',
        message: cleanupPrompt,
        maxTokens: 800,
        temperature: 0.1,
      });

      let cleanedText = cleanupResponse.text.trim();
      console.log(`JSON cleanup response time: ${Date.now() - cleanupStartTime}ms`);
      console.log('Cleanup response:', cleanedText.substring(0, 200) + '...');
      
      // Try to parse the cleaned response
      let parsedData = tryParseWithCleaning(cleanedText);
      
      // Validate and normalize
      if (typeof parsedData === 'object' && parsedData !== null) {
        const organizedIngredients = normalizeShoppingList(parsedData);
        
        const hasValidItems = Object.values(organizedIngredients).some(
          (items: any) => Array.isArray(items) && items.length > 0
        );
        
        if (hasValidItems) {
          console.log('✅ JSON cleanup succeeded!');
          return NextResponse.json({ 
            organizedIngredients,
            modelUsed: 'command-light (cleanup)',
            responseTime: Date.now() - overallStartTime,
            totalAttempts: 4
          });
        }
      }
      
      throw new Error('Cleanup attempt failed');
      
    } catch (cleanupError) {
      console.log('❌ JSON cleanup failed:', cleanupError);
      console.log('🔄 Falling back to reliable model...');
    }

    // STRATEGY 3: Fallback to reliable model with structured output
    const reliableStartTime = Date.now();
    const reliableResponse = await cohere.chat({
      model: 'command-r-plus',
      message: prompt,
      maxTokens: 1000,
      temperature: 0.1,
      responseFormat: { type: "json_object" }
    });

    let generatedText = reliableResponse.text.trim();
    console.log(`Reliable model response time: ${Date.now() - reliableStartTime}ms`);
    console.log('Raw reliable response:', generatedText);
    
    try {
      // With structured output, this should always be valid JSON
      const parsedData = JSON.parse(generatedText);
      
      // Validate the structure
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error('Response is not a valid object');
      }
      
      // Normalize the shopping list structure and aisle names
      const organizedIngredients = normalizeShoppingList(parsedData);
      
      console.log('✅ Reliable model succeeded!');
      return NextResponse.json({ 
        organizedIngredients,
        modelUsed: 'command-r-plus',
        responseTime: Date.now() - reliableStartTime,
        warning: 'Used slower but more reliable model due to fast model parsing issues.'
      });
      
    } catch (parseError) {
      console.error('❌ Even reliable model failed:', parseError);
      // Final fallback
      const organizedIngredients = createFallbackShoppingList(recipeName);
      
      return NextResponse.json({ 
        organizedIngredients,
        modelUsed: 'fallback',
        warning: 'Both AI models failed. Using basic shopping list.',
        rawResponse: generatedText,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      });
    }

  } catch (error) {
    console.error('Error generating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 }
    );
  }
} 