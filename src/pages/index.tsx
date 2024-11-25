// pages/index.tsx
import { useState, ChangeEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions
type Theme = 'dark' | 'light';

interface CompilerProps {}

interface CompilationResult {
  text(): string;
}

const Home: React.FC<CompilerProps> = () => {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('dark');

  const compileCode = async (): Promise<void> => {
    try {
      setLoading(true);
      // Use environment variable for API key
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
      const prompt: string = `
        Act as a code compiler. Analyze the code provided below, run it if valid, and return only the output.
        Do not include any additional information, explanations, or formatting such as backticks (\`).
        If there are errors, provide only the error message.
        
        Code:
        ${code}
      `;
  
      const result = await model.generateContent(prompt);
      const response = result.response;
      setOutput(response.text().trim());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setOutput(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setCode(e.target.value);
  };

  const handleThemeToggle = (): void => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Navigation Bar */}
      <nav className="border-b border-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Compiler</h1>
          <div className="flex gap-4">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded hover:bg-gray-700"
              type="button"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              type="button"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Code Editor */}
          <div className="border border-gray-700 rounded-lg">
            <div className="border-b border-gray-700 p-4 flex justify-between items-center">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <button
                onClick={compileCode}
                disabled={loading}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                type="button"
              >
                {loading ? 'Compiling...' : 'Run Code'}
              </button>
            </div>
            <textarea
              value={code}
              onChange={handleCodeChange}
              className="w-full h-[500px] p-4 bg-transparent focus:outline-none font-mono resize-none"
              placeholder="Write your code here..."
              spellCheck="false"
              aria-label="Code editor"
            />
          </div>

          {/* Output Panel */}
          <div className="border border-gray-700 rounded-lg">
            <div className="border-b border-gray-700 p-4">
              <h2 className="font-semibold">Output</h2>
            </div>
            <div 
              className="p-4 font-mono h-[500px] overflow-auto whitespace-pre-wrap"
              role="log"
              aria-live="polite"
            >
              {output || 'Output will appear here...'}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;