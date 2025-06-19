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

    const prompt = `Generate a shopping list for "${recipeName}" organized by supermarket aisle.

CRITICAL: Your response must be ONLY valid JSON, no extra text or formatting.

Required JSON format:
{
  "Produce": [{"ingredient": "onions", "quantity": "2 large"}],
  "Dairy": [{"ingredient": "milk", "quantity": "1 cup"}]
}

Available aisles: Produce, Dairy, Meat & Seafood, Pantry/Dry Goods, Frozen Foods, Bakery, Canned Goods, Condiments & Sauces, Spices & Seasonings, Beverages.

Recipe: ${recipeName}

JSON response:`;

    const response = await cohere.chat({
      model: 'command-light',
      message: prompt,
      maxTokens: 500,
      temperature: 0.1,
    });

    let generatedText = response.text.trim();
    
    // Clean up common formatting issues
    generatedText = generatedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    generatedText = generatedText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    
    console.log('Raw AI response:', generatedText);
    
    try {
      // Try to parse the JSON response
      const organizedIngredients = JSON.parse(generatedText);
      
      // Validate the structure
      if (typeof organizedIngredients !== 'object' || organizedIngredients === null) {
        throw new Error('Response is not a valid object');
      }
      
      return NextResponse.json({ organizedIngredients });
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      // If JSON parsing fails, return raw text for debugging
      return NextResponse.json({ 
        error: 'Failed to parse shopping list',
        rawResponse: generatedText,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
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