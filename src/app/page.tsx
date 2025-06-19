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

  const getAisleIcon = (aisle: string) => {
    const iconMap: { [key: string]: string } = {
      'Produce': '🥬',
      'Dairy': '🥛',
      'Meat & Seafood': '🥩',
      'Pantry/Dry Goods': '🏺',
      'Frozen Foods': '🧊',
      'Bakery': '🍞',
      'Canned Goods': '🥫',
      'Condiments & Sauces': '🍯',
      'Spices & Seasonings': '🌶️',
      'Beverages': '🥤',
    };
    return iconMap[aisle] || '🛒';
  };

  const totalProgress = () => {
    const totalItems = Object.values(organizedIngredients).reduce((sum, items) => sum + items.length, 0);
    const checkedCount = Array.from(checkedItems).length;
    return totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <span className="text-3xl">🛒</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
              Smart Recipe Organizer
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform any recipe into a perfectly organized shopping list, sorted by supermarket aisles
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 mb-12 hover:shadow-3xl transition-all duration-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label htmlFor="recipe" className="block text-lg font-semibold text-gray-700 mb-3">
                  What would you like to cook today?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="recipe"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g., Chicken Alfredo, Chocolate Chip Cookies, Beef Tacos..."
                    className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/50 backdrop-blur-sm placeholder-gray-400"
                    disabled={loading}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-2xl">👨‍🍳</span>
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !recipeName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:transform-none disabled:shadow-none text-lg relative overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                      <span className="animate-pulse">Creating your shopping list...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-2">✨</span>
                      Generate Smart Shopping List
                      <span className="ml-2">✨</span>
                    </div>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-6 p-4 bg-red-50/80 border-2 border-red-200 rounded-2xl backdrop-blur-sm animate-shake">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Shopping List */}
          {Object.keys(organizedIngredients).length > 0 && (
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 animate-fadeIn">
              {/* Header with progress */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    🛍️ Shopping List
                  </h2>
                  <p className="text-gray-600 text-lg">for <span className="font-semibold text-purple-600">{recipeName}</span></p>
                </div>
                
                {/* Overall Progress */}
                <div className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-4 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                    <span className="text-sm font-bold text-purple-600">{totalProgress()}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${totalProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Aisle Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Object.entries(organizedIngredients).map(([aisle, items], aisleIndex) => {
                  const progress = getAisleProgress(aisle);
                  const progressPercent = progress.total > 0 ? (progress.checked / progress.total) * 100 : 0;
                  const isComplete = progress.checked === progress.total && progress.total > 0;
                  
                  return (
                    <div 
                      key={aisle} 
                      className={`relative bg-white/60 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-xl animate-slideUp ${
                        isComplete 
                          ? 'border-green-300 bg-green-50/60' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      style={{ animationDelay: `${aisleIndex * 100}ms` }}
                    >
                      {/* Aisle Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getAisleIcon(aisle)}</span>
                          <h3 className="text-lg font-bold text-gray-800">{aisle}</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isComplete 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {progress.checked}/{progress.total}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-700 ease-out ${
                              isComplete 
                                ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                : 'bg-gradient-to-r from-purple-400 to-blue-400'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Items List */}
                      <ul className="space-y-3">
                        {items.map((item, index) => {
                          const itemKey = `${aisle}-${index}`;
                          const isChecked = checkedItems.has(itemKey);
                          
                          return (
                            <li key={index} className="group">
                              <label className="flex items-start cursor-pointer">
                                <div className="relative flex-shrink-0 mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleItem(aisle, index)}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                                    isChecked 
                                      ? 'bg-gradient-to-r from-green-400 to-green-500 border-green-500' 
                                      : 'border-gray-300 group-hover:border-purple-400'
                                  }`}>
                                    {isChecked && (
                                      <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span 
                                  className={`ml-3 text-sm leading-relaxed transition-all duration-300 ${
                                    isChecked 
                                      ? 'line-through text-gray-500' 
                                      : 'text-gray-700 group-hover:text-gray-900'
                                  }`}
                                >
                                  <span className="font-semibold text-purple-600">{item.quantity}</span> {item.ingredient}
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Complete Badge */}
                      {isComplete && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
                          ✓ Complete!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Shopping Tips */}
              <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border border-purple-200">
                <div className="flex items-start">
                  <span className="text-2xl mr-4 flex-shrink-0">💡</span>
                  <div>
                    <h4 className="font-bold text-purple-800 mb-2">Pro Shopping Tips:</h4>
                    <ul className="text-purple-700 space-y-1 text-sm">
                      <li>• Check off items as you add them to your cart</li>
                      <li>• Follow the aisle order of your local supermarket</li>
                      <li>• Keep frozen items for last to maintain freshness</li>
                      <li>• Double-check quantities before heading to checkout</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for organization failure */}
          {ingredients.length > 0 && Object.keys(organizedIngredients).length === 0 && (
            <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-orange-200 p-8 animate-fadeIn">
              <div className="text-center mb-6">
                <span className="text-4xl">⚠️</span>
                <h2 className="text-2xl font-bold text-orange-800 mt-2 mb-2">
                  Organization Temporarily Unavailable
                </h2>
                                   <p className="text-orange-600">Here&apos;s your ingredient list - you can organize it manually!</p>
              </div>
              
              <div className="bg-orange-50/60 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  Raw Ingredients for {recipeName}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {ingredients.map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-white/60 rounded-xl">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700">
                        <span className="font-semibold text-orange-600">{item.quantity}</span> {item.ingredient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
