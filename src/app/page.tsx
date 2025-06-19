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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll tracking with parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Stylish entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Auto-focus with style
  useEffect(() => {
    if (inputRef.current && !loading) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, [loading]);

  // Auto-scroll to results when they're ready
  useEffect(() => {
    if ((Object.keys(organizedIngredients).length > 0 || ingredients.length > 0) && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 300); // Small delay to ensure DOM is updated
    }
  }, [organizedIngredients, ingredients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) return;

    setLoading(true);
    setError('');
    setIngredients([]);
    setOrganizedIngredients({});
    setCheckedItems(new Set());

    try {
      // Single optimized API call - Get organized shopping list
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate shopping list');
      }

      if (data.error) {
        setError(`Shopping list generation error: ${data.error}`);
        if (data.rawResponse) {
          console.log('Raw response:', data.rawResponse);
        }
      } else {
        setOrganizedIngredients(data.organizedIngredients);
        // Convert organized ingredients back to flat list for compatibility
        const flatIngredients: Ingredient[] = [];
        Object.values(data.organizedIngredients as OrganizedIngredients).forEach((aisleItems) => {
          flatIngredients.push(...aisleItems);
        });
        setIngredients(flatIngredients);
        
        // Show warning if there was a parsing issue but we still got results
        if (data.warning) {
          console.warn('Shopping list warning:', data.warning);
          // You could also show a toast notification here if desired
        }
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

  // Check if results are present to adjust header size
  const hasResults = Object.keys(organizedIngredients).length > 0 || ingredients.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Dynamic floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large animated blobs */}
        <div 
          className="absolute -top-96 -right-96 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse"
          style={{ 
            transform: `translate(${scrollY * 0.1 + mousePosition.x * 0.02}px, ${scrollY * 0.05 + mousePosition.y * 0.02}px)`,
            animationDuration: '4s'
          }}
        />
        <div 
          className="absolute -bottom-96 -left-96 w-[800px] h-[800px] bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse"
          style={{ 
            transform: `translate(${-scrollY * 0.1 - mousePosition.x * 0.02}px, ${-scrollY * 0.05 - mousePosition.y * 0.02}px)`,
            animationDuration: '3s',
            animationDelay: '1s'
          }}
        />
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-200/25 to-teal-200/25 rounded-full blur-2xl animate-pulse"
          style={{ 
            transform: `translate(${scrollY * 0.15}px, ${scrollY * 0.08}px)`,
            animationDuration: '5s',
            animationDelay: '2s'
          }}
        />

        {/* Floating food emojis */}
        <div className="absolute top-20 left-20 text-4xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>🍎</div>
        <div className="absolute top-40 right-32 text-3xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>🥕</div>
        <div className="absolute bottom-60 left-16 text-5xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>🍕</div>
        <div className="absolute bottom-40 right-20 text-3xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>🥐</div>
        <div className="absolute top-60 left-1/2 text-4xl animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>🍳</div>
        <div className="absolute bottom-96 right-1/3 text-3xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '4s' }}>🧄</div>
      </div>

      <div className={`relative z-10 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Fun and vibrant header - compact when results are present */}
          <header 
            className={`text-center relative transition-all duration-700 ${
              hasResults 
                ? 'pt-8 pb-8' // Compact when results are present
                : 'pt-20 pb-16' // Full size when no results
            }`}
            style={{ opacity: Math.max(0.4, 1 - scrollY / 400) }}
          >
            {/* Animated hero icon - smaller when results are present */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-60 animate-pulse"></div>
              <div className={`relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-2xl shadow-purple-500/30 flex items-center justify-center transform hover:scale-110 hover:rotate-12 transition-all duration-700 cursor-pointer group ${
                hasResults ? 'w-20 h-20' : 'w-32 h-32'
              }`}>
                <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <span className={`group-hover:scale-110 transition-transform duration-300 ${
                  hasResults ? 'text-3xl' : 'text-5xl'
                }`}>🛒</span>
                <div className={`absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce ${
                  hasResults ? 'w-6 h-6' : 'w-8 h-8'
                }`}>
                  <span className={hasResults ? 'text-sm' : 'text-lg'}>✨</span>
                </div>
              </div>
            </div>
            
            {/* Dynamic gradient title - smaller when results are present */}
            <h1 className={`font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight relative transition-all duration-700 ${
              hasResults 
                ? 'text-4xl sm:text-5xl mb-4' // Compact when results are present
                : 'text-7xl sm:text-8xl mb-8' // Full size when no results
            }`}>
              <span className="relative">
                Recipe Organizer
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg opacity-10 blur-xl"></div>
              </span>
            </h1>
            
            {/* Fun subtitle with animations - hide when results are present */}
            {!hasResults && (
              <div className="max-w-4xl mx-auto mb-8">
                <p className="text-2xl text-gray-700 leading-relaxed font-medium mb-4">
                  Transform any recipe into an 
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold"> intelligently organized </span>
                  shopping experience
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-lg">
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-semibold">🤖 AI-Powered</span>
                  <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-semibold">🏪 Aisle Organized</span>
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-semibold">⚡ Instant</span>
                </div>
              </div>
            )}

            {/* Interactive demo elements - hide when results are present */}
            {!hasResults && (
              <div className="flex justify-center space-x-8 mb-8">
                <div className="animate-float" style={{ animationDelay: '0s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-2xl">🍅</span>
                  </div>
                </div>
                <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-2xl">🧀</span>
                  </div>
                </div>
                <div className="animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-2xl">🥬</span>
                  </div>
                </div>
                <div className="animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-2xl">🥛</span>
                  </div>
                </div>
              </div>
            )}
          </header>

          {/* Enhanced input section with more style */}
          <section className={`transition-all duration-700 ${hasResults ? 'mb-8' : 'mb-20'}`}>
            <div className="max-w-3xl mx-auto">
              <div className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] border-2 border-white/60 shadow-2xl shadow-purple-500/10 p-10 hover:shadow-3xl hover:shadow-purple-500/20 transition-all duration-700 group">
                {/* Decorative elements */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <label className="block text-2xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      What delicious dish are you craving? 
                      <span className="text-3xl ml-2">🤤</span>
                    </label>
                    <div className="relative group/input">
                      <input
                        ref={inputRef}
                        type="text"
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        placeholder="Try 'Spicy Thai Curry', 'Grandma's Apple Pie', or 'Perfect Pasta Carbonara'..."
                        className="w-full px-8 py-6 text-xl text-gray-900 bg-gradient-to-r from-gray-50 to-white border-3 border-gray-200/60 rounded-3xl focus:bg-white focus:border-purple-400 focus:ring-6 focus:ring-purple-400/20 transition-all duration-500 outline-none placeholder-gray-400 font-medium shadow-inner group-focus-within:shadow-lg"
                        disabled={loading}
                      />
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2 transition-all duration-500 group-focus-within/input:scale-125 group-focus-within/input:rotate-12">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-2xl">👨‍🍳</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !recipeName.trim()}
                    className="group relative w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-6 px-10 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1 hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:shadow-none"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 animate-shimmer"></div>
                    <span className="relative z-10 flex items-center justify-center text-xl">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-4 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="animate-pulse">Creating your magical shopping list...</span>
                        </>
                      ) : (
                        <>
                          <span className="mr-3 text-2xl">🪄</span>
                          Generate My Smart Shopping List
                          <span className="ml-3 text-2xl">✨</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>

                {error && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200/60 rounded-3xl backdrop-blur-sm animate-shake">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                          <span className="text-2xl">😵</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-red-800 font-semibold text-lg">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Results indicator - shows when results are ready */}
          {hasResults && (
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
                <span className="text-lg">🎉</span>
                <span className="font-bold">Your shopping list is ready!</span>
                <span className="text-lg">🛍️</span>
              </div>
            </div>
          )}

          {/* Shopping list section with ref for auto-scroll */}
          {Object.keys(organizedIngredients).length > 0 && (
            <section ref={resultsRef} className="pb-20">
              <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] border-2 border-white/40 shadow-2xl shadow-indigo-500/10 p-8 sm:p-12">
                
                {/* Enhanced header */}
                <header className="mb-12">
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start mb-4">
                        <span className="text-5xl mr-4">🛍️</span>
                        <h2 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                          Shopping List
                        </h2>
                      </div>
                      <p className="text-2xl text-gray-600 font-medium">
                        for your amazing <span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{recipeName}</span>
                      </p>
                    </div>
                    
                    {/* Enhanced progress indicator */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 border-2 border-indigo-200/50 shadow-lg min-w-[320px]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-gray-700">Overall Progress</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {totalProgress()}%
                          </span>
                          <span className="text-2xl">{totalProgress() === 100 ? '🎉' : '⏳'}</span>
                        </div>
                      </div>
                      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${totalProgress()}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </header>
                
                {/* Aisle grid with enhanced styling */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {Object.entries(organizedIngredients).map(([aisle, items], aisleIndex) => {
                    const progress = getAisleProgress(aisle);
                    const progressPercent = progress.total > 0 ? (progress.checked / progress.total) * 100 : 0;
                    const isComplete = progress.checked === progress.total && progress.total > 0;
                    const colorGradient = getAisleColor(aisle);
                    
                    return (
                      <div 
                        key={aisle}
                        className={`group relative bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-3xl p-8 transition-all duration-700 hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/10 cursor-pointer ${
                          isComplete ? 'ring-4 ring-green-400/60 bg-green-50/60 shadow-green-500/20' : 'hover:border-purple-300/50'
                        }`}
                        style={{ 
                          animationDelay: `${aisleIndex * 150}ms`,
                          transform: `translateY(${isComplete ? -4 : 0}px)`
                        }}
                        onDragStart={() => setDraggedAisle(aisle)}
                        onDragEnd={() => setDraggedAisle(null)}
                        draggable
                      >
                        {/* Enhanced aisle header */}
                        <header className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`w-16 h-16 bg-gradient-to-br ${colorGradient} rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                              <span className="text-2xl">{getAisleIcon(aisle)}</span>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 tracking-tight">{aisle}</h3>
                              <p className="text-sm text-gray-500 font-medium">{items.length} items</p>
                            </div>
                          </div>
                          
                          <div className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-md transition-all duration-300 ${
                            isComplete 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-300/50' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {progress.checked}/{progress.total}
                          </div>
                        </header>
                        
                        {/* Enhanced progress bar */}
                        <div className="mb-8">
                          <div className="relative w-full h-3 bg-gray-200/60 rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                                isComplete 
                                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                  : `bg-gradient-to-r ${colorGradient}`
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Enhanced items list */}
                        <ul className="space-y-4">
                          {items.map((item, index) => {
                            const itemKey = `${aisle}-${index}`;
                            const isChecked = checkedItems.has(itemKey);
                            
                            return (
                              <li key={index} className="group/item">
                                <label className="flex items-start space-x-4 cursor-pointer hover:bg-gray-50/50 rounded-2xl p-2 transition-all duration-200">
                                  <div className="relative flex-shrink-0 mt-1">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleItem(aisle, index)}
                                      className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-full border-3 transition-all duration-300 ${
                                      isChecked 
                                        ? `bg-gradient-to-br ${colorGradient} border-transparent shadow-lg scale-110` 
                                        : 'border-gray-300 group-hover/item:border-gray-400 hover:scale-105'
                                    }`}>
                                      {isChecked && (
                                        <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`flex-1 transition-all duration-300 ${
                                    isChecked ? 'opacity-60' : 'opacity-100'
                                  }`}>
                                    <p className={`text-sm leading-relaxed font-medium ${
                                      isChecked 
                                        ? 'line-through text-gray-500' 
                                        : 'text-gray-700 group-hover/item:text-gray-900'
                                    }`}>
                                      <span className={`font-bold bg-gradient-to-r ${colorGradient} bg-clip-text text-transparent`}>
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

                        {/* Enhanced completion badge */}
                        {isComplete && (
                          <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-sm font-bold px-6 py-3 rounded-full shadow-2xl animate-bounce border-4 border-white">
                            🎉 Complete!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced tips section */}
                <div className="mt-16 p-10 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 rounded-3xl border-2 border-indigo-200/40 backdrop-blur-sm">
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl">
                        <span className="text-3xl">💡</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 mb-6">Pro Shopping Tips</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-gray-700 font-medium">
                        <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-2xl">
                          <span className="w-3 h-3 bg-indigo-400 rounded-full flex-shrink-0"></span>
                          <span>Check items as you shop</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-2xl">
                          <span className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></span>
                          <span>Follow your store&apos;s layout</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-2xl">
                          <span className="w-3 h-3 bg-pink-400 rounded-full flex-shrink-0"></span>
                          <span>Save frozen items for last</span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-2xl">
                          <span className="w-3 h-3 bg-emerald-400 rounded-full flex-shrink-0"></span>
                          <span>Double-check quantities</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Enhanced fallback state with ref for auto-scroll */}
          {ingredients.length > 0 && Object.keys(organizedIngredients).length === 0 && (
            <section ref={resultsRef} className="pb-20">
              <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] border-2 border-orange-200/60 shadow-2xl shadow-orange-500/10 p-8 sm:p-12">
                <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl animate-pulse">
                    <span className="text-4xl">🔄</span>
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Organization is happening...
                  </h2>
                  <p className="text-xl text-gray-600 max-w-lg mx-auto">
                    Here&apos;s your ingredient list. We&apos;re working on organizing it for you.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50/60 to-red-50/60 rounded-3xl p-10 border-2 border-orange-200/50">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center justify-center">
                    <span className="mr-4 text-3xl">📝</span>
                    Ingredients for {recipeName}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {ingredients.map((item, index) => (
                      <div key={index} className="flex items-center p-5 bg-white/70 rounded-3xl border-2 border-orange-200/40 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-red-400 rounded-full mr-5 flex-shrink-0 animate-pulse"></div>
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium">
                            <span className="font-bold text-orange-600">{item.quantity}</span> {item.ingredient}
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

      {/* Enhanced floating action button */}
      {Object.keys(organizedIngredients).length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/30 flex items-center justify-center text-white hover:scale-110 hover:shadow-3xl hover:shadow-purple-500/40 transition-all duration-300 group"
          >
            <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      )}

      {/* Enhanced CSS animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        /* Enhanced smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced selection */
        ::selection {
          background-color: rgba(147, 51, 234, 0.3);
        }

        /* Enhanced focus rings */
        *:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
