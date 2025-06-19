import { CohereClient } from 'cohere-ai';
import { NextRequest, NextResponse } from 'next/server';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: 'Ingredients array is required' },
        { status: 400 }
      );
    }

    const prompt = `Organize the following ingredients by supermarket aisle/section. Group them logically as they would appear in a typical supermarket. Return a JSON object where keys are aisle names and values are arrays of ingredients (with quantities).

Common supermarket aisles include:
- Produce
- Dairy
- Meat & Seafood
- Pantry/Dry Goods
- Frozen Foods
- Bakery
- Canned Goods
- Condiments & Sauces
- Spices & Seasonings
- Beverages

Ingredients to organize:
${ingredients.map((item: { quantity: string; ingredient: string }) => `${item.quantity} ${item.ingredient}`).join('\n')}

Return only the JSON object, no additional text.

Example format:
{
  "Produce": [
    {"ingredient": "onions", "quantity": "2 large"},
    {"ingredient": "tomatoes", "quantity": "4 medium"}
  ],
  "Dairy": [
    {"ingredient": "milk", "quantity": "1 gallon"}
  ]
}`;

    const response = await cohere.chat({
      model: 'command',
      message: prompt,
      maxTokens: 800,
      temperature: 0.3,
    });

    const generatedText = response.text.trim();
    
    try {
      const organizedIngredients = JSON.parse(generatedText);
      return NextResponse.json({ organizedIngredients });
    } catch {
      return NextResponse.json({ 
        error: 'Failed to parse organized ingredients',
        rawResponse: generatedText 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error organizing ingredients:', error);
    return NextResponse.json(
      { error: 'Failed to organize ingredients' },
      { status: 500 }
    );
  }
} 