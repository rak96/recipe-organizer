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

    const prompt = `For the recipe "${recipeName}", provide a detailed list of ingredients with quantities. Format the response as a JSON array where each item has "ingredient" and "quantity" fields. Only return the JSON array, no additional text.

Example format:
[
  {"ingredient": "flour", "quantity": "2 cups"},
  {"ingredient": "eggs", "quantity": "3 large"},
  {"ingredient": "milk", "quantity": "1 cup"}
]

Recipe: ${recipeName}`;

    const response = await cohere.chat({
      model: 'command',
      message: prompt,
      maxTokens: 500,
      temperature: 0.3,
    });

    const generatedText = response.text.trim();
    
    try {
      // Try to parse the JSON response
      const ingredients = JSON.parse(generatedText);
      return NextResponse.json({ ingredients });
    } catch (parseError) {
      // If JSON parsing fails, return raw text for debugging
      return NextResponse.json({ 
        error: 'Failed to parse ingredients',
        rawResponse: generatedText 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to generate recipe' },
      { status: 500 }
    );
  }
} 