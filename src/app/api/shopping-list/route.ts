import { CohereClient } from 'cohere-ai';
import { NextRequest, NextResponse } from 'next/server';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { recipeName } = await request.json();

    if (!recipeName) {
      return NextResponse.json(
        { error: 'Recipe name is required' },
        { status: 400 }
      );
    }

    const prompt = `For the recipe "${recipeName}", generate a complete shopping list organized by supermarket aisle. 

First, determine all ingredients with quantities needed for this recipe. Then organize them by typical supermarket aisles.

Return ONLY a JSON object in this exact format:
{
  "Produce": [
    {"ingredient": "onions", "quantity": "2 large"},
    {"ingredient": "tomatoes", "quantity": "4 medium"}
  ],
  "Dairy": [
    {"ingredient": "milk", "quantity": "1 gallon"}
  ],
  "Meat & Seafood": [
    {"ingredient": "chicken breast", "quantity": "1 lb"}
  ]
}

Use these common aisles when appropriate: Produce, Dairy, Meat & Seafood, Pantry/Dry Goods, Frozen Foods, Bakery, Canned Goods, Condiments & Sauces, Spices & Seasonings, Beverages.

Recipe: ${recipeName}`;

    const response = await cohere.chat({
      model: 'command-light',
      message: prompt,
      maxTokens: 400,
      temperature: 0.1,
    });

    const generatedText = response.text.trim();
    
    try {
      // Try to parse the JSON response
      const organizedIngredients = JSON.parse(generatedText);
      return NextResponse.json({ organizedIngredients });
    } catch {
      // If JSON parsing fails, return raw text for debugging
      return NextResponse.json({ 
        error: 'Failed to parse shopping list',
        rawResponse: generatedText 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping list' },
      { status: 500 }
    );
  }
} 