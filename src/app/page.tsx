'use client';

import { useState } from 'react';

interface Ingredient {
  ingredient: string;
  quantity: string;
}

interface OrganizedIngredients {
  [aisle: string]: Ingredient[];
}

export default function Home() {
  const [recipeName, setRecipeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [organizedIngredients, setOrganizedIngredients] = useState<OrganizedIngredients>({});
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;

    setLoading(true);
    setError('');
    setIngredients([]);
    setOrganizedIngredients({});
    setCheckedItems(new Set());

    try {
      // First API call - Get recipe ingredients
      const recipeResponse = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeName }),
      });

      const recipeData = await recipeResponse.json();

      if (!recipeResponse.ok) {
        throw new Error(recipeData.error || 'Failed to get recipe');
      }

      if (recipeData.error) {
        setError(`Recipe generation error: ${recipeData.error}`);
        if (recipeData.rawResponse) {
          console.log('Raw response:', recipeData.rawResponse);
        }
        setLoading(false);
        return;
      }

      setIngredients(recipeData.ingredients);

      // Second API call - Organize ingredients by aisle
      const organizeResponse = await fetch('/api/organize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients: recipeData.ingredients }),
      });

      const organizeData = await organizeResponse.json();

      if (!organizeResponse.ok) {
        throw new Error(organizeData.error || 'Failed to organize ingredients');
      }

      if (organizeData.error) {
        setError(`Organization error: ${organizeData.error}`);
        if (organizeData.rawResponse) {
          console.log('Raw response:', organizeData.rawResponse);
        }
      } else {
        setOrganizedIngredients(organizeData.organizedIngredients);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (aisle: string, index: number) => {
    const itemKey = `${aisle}-${index}`;
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemKey)) {
      newCheckedItems.delete(itemKey);
    } else {
      newCheckedItems.add(itemKey);
    }
    setCheckedItems(newCheckedItems);
  };

  const getAisleProgress = (aisle: string) => {
    const aisleItems = organizedIngredients[aisle] || [];
    const checkedCount = aisleItems.filter((_, index) => 
      checkedItems.has(`${aisle}-${index}`)
    ).length;
    return { checked: checkedCount, total: aisleItems.length };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛒 Smart Recipe Organizer
          </h1>
          <p className="text-lg text-gray-600">
            Enter a recipe name and get ingredients organized by supermarket aisle
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="recipe" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Name
              </label>
              <input
                type="text"
                id="recipe"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                placeholder="e.g., Chicken Alfredo, Chocolate Chip Cookies, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !recipeName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing Recipe...
                </div>
              ) : (
                'Get Shopping List'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>

        {Object.keys(organizedIngredients).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Shopping List for: {recipeName}
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(organizedIngredients).map(([aisle, items]) => {
                const progress = getAisleProgress(aisle);
                const progressPercent = progress.total > 0 ? (progress.checked / progress.total) * 100 : 0;
                
                return (
                  <div key={aisle} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{aisle}</h3>
                      <span className="text-sm text-gray-500">
                        {progress.checked}/{progress.total}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <ul className="space-y-2">
                      {items.map((item, index) => {
                        const itemKey = `${aisle}-${index}`;
                        const isChecked = checkedItems.has(itemKey);
                        
                        return (
                          <li key={index} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleItem(aisle, index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                            />
                            <span 
                              className={`text-sm ${
                                isChecked 
                                  ? 'line-through text-gray-500' 
                                  : 'text-gray-700'
                              }`}
                            >
                              {item.quantity} {item.ingredient}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Shopping Tip:</strong> Check off items as you add them to your cart. 
                The progress bars will help you track completion by aisle!
              </p>
            </div>
          </div>
        )}

        {ingredients.length > 0 && Object.keys(organizedIngredients).length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Raw Ingredients (Organization Failed)
            </h2>
            <ul className="space-y-2">
              {ingredients.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item.quantity} {item.ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
