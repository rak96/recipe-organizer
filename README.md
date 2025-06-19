# 🛒 Smart Recipe Organizer

A Next.js app that uses Cohere AI to organize recipe ingredients by supermarket aisle, making grocery shopping more efficient.

## Features

- **Recipe Input**: Enter any recipe name
- **AI-Powered Ingredient Generation**: Uses Cohere's completion API to generate detailed ingredient lists
- **Smart Organization**: Uses Cohere's classification to organize ingredients by supermarket aisle
- **Interactive Shopping List**: Check off items as you shop with progress tracking
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Cohere API key (get one at [cohere.ai](https://cohere.ai))

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd recipe-organizer
   ```

2. **Set up Python virtual environment:**
   ```bash
   # Go back to parent directory
   cd ..
   
   # Create and activate virtual environment
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Python dependencies
   pip install cohere
   
   # Go back to project directory
   cd recipe-organizer
   ```

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   # Update .env.local with your Cohere API key
   echo "COHERE_API_KEY=your_actual_cohere_api_key_here" > .env.local
   ```

5. **Run the development server:**
   ```bash
   # Make sure your virtual environment is activated
   source ../venv/bin/activate
   
   # Start the Next.js development server
   npm run dev
   ```

6. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add `COHERE_API_KEY` in the Environment Variables section

## How It Works

1. **User Input**: User enters a recipe name (e.g., "Chicken Alfredo")

2. **First Cohere API Call** (`/api/recipe`):
   - Uses Cohere's completion model to generate a detailed ingredient list
   - Returns structured JSON with ingredients and quantities

3. **Second Cohere API Call** (`/api/organize`):
   - Takes the ingredient list and organizes it by supermarket aisle
   - Uses Cohere's text generation to classify ingredients into categories like:
     - Produce
     - Dairy
     - Meat & Seafood
     - Pantry/Dry Goods
     - Frozen Foods
     - Bakery
     - And more...

4. **Interactive Shopping Interface**:
   - Displays ingredients organized by aisle
   - Users can check off items as they shop
   - Progress bars show completion status for each aisle

## API Endpoints

- `POST /api/recipe` - Generate ingredient list from recipe name
- `POST /api/organize` - Organize ingredients by supermarket aisle

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Cohere AI (completion and classification)
- **Deployment**: Vercel

## Example Usage

1. Enter "Chocolate Chip Cookies" in the recipe input
2. The app generates ingredients like flour, eggs, chocolate chips, etc.
3. Ingredients are organized by aisle:
   - **Pantry/Dry Goods**: 2 cups flour, 1 cup sugar
   - **Dairy**: 2 eggs, 1/2 cup butter
   - **Baking**: 1 cup chocolate chips
4. Check off items as you shop, with progress tracking per aisle

## Virtual Environment Usage

This project uses a Python virtual environment to manage Python dependencies (specifically the Cohere library). Make sure to activate it before running the development server:

```bash
source ../venv/bin/activate
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with your Cohere API key
5. Submit a pull request

## License

MIT License - see LICENSE file for details
