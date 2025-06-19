'use client';

import { useState, useEffect, useRef } from 'react';

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
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [, setDraggedAisle] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Apple-style smooth scroll tracking
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Apple-style entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Focus input on load (Apple UX pattern)
  useEffect(() => {
    if (inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [loading]);

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
      'Pantry/Dry Goods': '🌾',
      'Frozen Foods': '❄️',
      'Bakery': '🥖',
      'Canned Goods': '🥫',
      'Condiments & Sauces': '🍯',
      'Spices & Seasonings': '🌿',
      'Beverages': '🥤',
    };
    return iconMap[aisle] || '🛒';
  };

  const totalProgress = () => {
    const totalItems = Object.values(organizedIngredients).reduce((sum, items) => sum + items.length, 0);
    const checkedCount = Array.from(checkedItems).length;
    return totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  };

  const getAisleColor = (aisle: string) => {
    const colors = [
      'from-rose-400 to-pink-400',
      'from-orange-400 to-amber-400', 
      'from-green-400 to-emerald-400',
      'from-blue-400 to-cyan-400',
      'from-purple-400 to-violet-400',
      'from-indigo-400 to-blue-400',
      'from-teal-400 to-cyan-400',
      'from-yellow-400 to-orange-400',
      'from-pink-400 to-rose-400',
      'from-emerald-400 to-teal-400'
    ];
    const index = Object.keys(organizedIngredients).indexOf(aisle);
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Apple-style dynamic background with parallax */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-96 -right-96 w-[800px] h-[800px] bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-full blur-3xl"
          style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)` }}
        />
        <div 
          className="absolute -bottom-96 -left-96 w-[800px] h-[800px] bg-gradient-to-tr from-green-100/40 to-blue-100/40 rounded-full blur-3xl"
          style={{ transform: `translate(${-scrollY * 0.1}px, ${-scrollY * 0.05}px)` }}
        />
      </div>

      <div className={`relative z-10 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Apple-style header with dynamic opacity */}
          <header 
            className="pt-16 pb-12 text-center"
            style={{ opacity: Math.max(0.3, 1 - scrollY / 300) }}
          >
            <div className="inline-flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/25 flex items-center justify-center transform transition-transform hover:scale-110 hover:rotate-3 duration-500">
                  <span className="text-3xl">🛒</span>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl opacity-20 blur-xl animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 tracking-tight">
              Recipe Organizer
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
              Transform any recipe into an intelligently organized shopping experience
            </p>
          </header>

          {/* Apple-style input section */}
          <section className="mb-16">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-2xl shadow-black/5 p-8 hover:shadow-3xl transition-all duration-700">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-4">
                    <label className="block text-lg font-semibold text-gray-800 tracking-wide">
                      What would you like to cook?
                    </label>
                    <div className="relative group">
                      <input
                        ref={inputRef}
                        type="text"
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        placeholder="Try 'Chicken Alfredo' or 'Chocolate Chip Cookies'"
                        className="w-full px-6 py-5 text-lg bg-gray-50/50 border-2 border-gray-200/50 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 outline-none placeholder-gray-400 font-medium"
                        disabled={loading}
                      />
                      <div className="absolute right-5 top-1/2 transform -translate-y-1/2 transition-all duration-300 group-focus-within:scale-110">
                        <span className="text-2xl">👨‍🍳</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !recipeName.trim()}
                    className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-5 px-8 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center text-lg">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="animate-pulse">Creating your list...</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-2">✨</span>
                          Generate Shopping List
                          <span className="ml-2">✨</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {error && (
                  <div className="mt-6 p-5 bg-red-50/80 border border-red-200/50 rounded-2xl backdrop-blur-sm animate-shake">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Apple-style shopping list with sophisticated animations */}
          {Object.keys(organizedIngredients).length > 0 && (
            <section className="pb-20">
              <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/30 shadow-2xl shadow-black/5 p-8 sm:p-12">
                
                {/* Sophisticated header with live progress */}
                <header className="mb-12">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                        Shopping List
                      </h2>
                      <p className="text-xl text-gray-600">
                        for <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{recipeName}</span>
                      </p>
                    </div>
                    
                    {/* Apple-style progress indicator */}
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border border-gray-200/50 shadow-lg min-w-[280px]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {totalProgress()}%
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${totalProgress()}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </header>
                
                {/* Apple-style masonry grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(organizedIngredients).map(([aisle, items], aisleIndex) => {
                    const progress = getAisleProgress(aisle);
                    const progressPercent = progress.total > 0 ? (progress.checked / progress.total) * 100 : 0;
                    const isComplete = progress.checked === progress.total && progress.total > 0;
                    const colorGradient = getAisleColor(aisle);
                    
                    return (
                      <div 
                        key={aisle}
                        className={`group relative bg-white/70 backdrop-blur-sm border border-white/50 rounded-3xl p-6 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/10 cursor-pointer ${
                          isComplete ? 'ring-2 ring-green-400/50 bg-green-50/50' : ''
                        }`}
                        style={{ 
                          animationDelay: `${aisleIndex * 100}ms`,
                          transform: `translateY(${isComplete ? -2 : 0}px)`
                        }}
                        onDragStart={() => setDraggedAisle(aisle)}
                        onDragEnd={() => setDraggedAisle(null)}
                        draggable
                      >
                        {/* Apple-style header with icon */}
                        <header className="flex items-center justify-between mb-5">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                              <span className="text-xl">{getAisleIcon(aisle)}</span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{aisle}</h3>
                              <p className="text-sm text-gray-500">{items.length} items</p>
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            isComplete 
                              ? 'bg-green-100 text-green-700 shadow-green-200/50' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {progress.checked}/{progress.total}
                          </div>
                        </header>
                        
                        {/* Sophisticated progress bar */}
                        <div className="mb-6">
                          <div className="relative w-full h-2 bg-gray-200/50 rounded-full overflow-hidden">
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                                isComplete 
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                  : `bg-gradient-to-r ${colorGradient}`
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Apple-style items list */}
                        <ul className="space-y-4">
                          {items.map((item, index) => {
                            const itemKey = `${aisle}-${index}`;
                            const isChecked = checkedItems.has(itemKey);
                            
                            return (
                              <li key={index} className="group/item">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                  <div className="relative flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleItem(aisle, index)}
                                      className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                                      isChecked 
                                        ? `bg-gradient-to-br ${colorGradient} border-transparent shadow-lg scale-110` 
                                        : 'border-gray-300 group-hover/item:border-gray-400 hover:scale-105'
                                    }`}>
                                      {isChecked && (
                                        <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`flex-1 transition-all duration-300 ${
                                    isChecked ? 'opacity-60' : 'opacity-100'
                                  }`}>
                                    <p className={`text-sm leading-relaxed ${
                                      isChecked 
                                        ? 'line-through text-gray-500' 
                                        : 'text-gray-700 group-hover/item:text-gray-900'
                                    }`}>
                                      <span className={`font-semibold bg-gradient-to-r ${colorGradient} bg-clip-text text-transparent`}>
                                        {item.quantity}
                                      </span>
                                      {' '}{item.ingredient}
                                    </p>
                                  </div>
                                </label>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Apple-style completion badge */}
                        {isComplete && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl animate-bounce">
                            ✓ Complete
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Apple-style tips section */}
                <div className="mt-12 p-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-3xl border border-blue-200/30 backdrop-blur-sm">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-xl">💡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-3">Smart Shopping Tips</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                          <span>Check items as you shop</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                          <span>Follow your store&apos;s layout</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                          <span>Save frozen items for last</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                          <span>Double-check quantities</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Apple-style fallback state */}
          {ingredients.length > 0 && Object.keys(organizedIngredients).length === 0 && (
            <section className="pb-20">
              <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-orange-200/50 shadow-2xl shadow-orange-500/5 p-8 sm:p-12">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Organization Unavailable
                  </h2>
                  <p className="text-lg text-gray-600 max-w-lg mx-auto">
                    Here&apos;s your ingredient list. You can organize it manually for now.
                  </p>
                </div>
                
                <div className="bg-orange-50/50 rounded-3xl p-8 border border-orange-200/50">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center">
                    <span className="mr-3">📝</span>
                    Ingredients for {recipeName}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {ingredients.map((item, index) => (
                      <div key={index} className="flex items-center p-4 bg-white/60 rounded-2xl border border-orange-200/30 hover:shadow-lg transition-all duration-300">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mr-4 flex-shrink-0"></div>
                        <div className="flex-1">
                          <span className="text-gray-700">
                            <span className="font-semibold text-orange-600">{item.quantity}</span> {item.ingredient}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Apple-style floating action button */}
      {Object.keys(organizedIngredients).length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/25 flex items-center justify-center text-white hover:scale-110 hover:shadow-3xl transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      )}

      {/* Custom CSS for Apple-style animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }

        /* Apple-style smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Apple-style selection */
        ::selection {
          background-color: rgba(59, 130, 246, 0.3);
        }

        /* Apple-style focus rings */
        *:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
