import { useState, ChangeEvent, KeyboardEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions
type Theme = 'dark' | 'light';
type CompilerMode = 'editing' | 'running' | 'awaiting-input';

interface CompilerProps {}

const Home: React.FC<CompilerProps> = () => {
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [mode, setMode] = useState<CompilerMode>('editing');

  const compileCode = async (): Promise<void> => {
    try {
      setLoading(true);
      setMode('running');
      
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
      const prompt: string = `
        Advanced Python Code Execution Instructions:
        1. Execute the code with the given input
        2. Return only the final output
        3. Do not include any additional text or explanations
        4. User input must be asked only when the user is trying to test his input
        5. Do not give your own input
        6. When the user is trying to run other code give the output directly
        7. When you think there is no input function, simply print the output
        8. Other than code, if the user types any other random things, tell him it's an error

        Specific Validation Rules:
        - If the code requires input, return exactly the input prompt
        - If no input is needed, run and return the output
        - Detect and validate input type based on the input() function used
        - Prepare to reject invalid inputs

        Code:
        ${code}

        Execution Context:
        Strictly follow the above instructions during code execution.
      `;
  
      const result = await model.generateContent(prompt);
      const response = result.response;
      const processedOutput = response.text().trim();
      
      setOutput(processedOutput);
      
      // Check if output suggests waiting for input
      if (processedOutput.toLowerCase().includes('enter') && processedOutput.includes(':')) {
        setMode('awaiting-input');
      } else {
        setMode('editing');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setOutput(`Error: ${errorMessage}`);
      setMode('editing');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setCode(e.target.value);
  };

  const handleOutputInput = async (e: KeyboardEvent<HTMLDivElement>): Promise<void> => {
    if (mode === 'awaiting-input' && e.key === 'Enter') {
      const input = (e.target as HTMLDivElement).textContent?.split(':').pop()?.trim() || '';
      
      try {
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
        const prompt: string = `
          Strict Input Validation and Code Execution:
          1. Validate the user input against the expected input type
          2. If input is invalid, return an error message
          3. If input is valid, execute the code
          4. Return only the final output or error
          5. Strictly follow the previously mentioned instructions

          Code:
          ${code}

          User Input: ${input}

          Validation Instructions:
          - Check if the input matches the expected type (int, float, string)
          - Reject any input that doesn't make sense in the context
          - Provide clear error messages for invalid inputs
        `;
  
        const result = await model.generateContent(prompt);
        const response = result.response;
        const processedOutput = response.text().trim();

        // Check if the output is an error or valid result
        if (processedOutput.toLowerCase().includes('error') || 
            processedOutput.toLowerCase().includes('invalid')) {
          setOutput(`Error: Invalid input. ${processedOutput}`);
        } else {
          setOutput(processedOutput);
        }
        
        setMode('editing');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setOutput(`Error processing input: ${errorMessage}`);
        setMode('editing');
      }
    }
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
                disabled={loading || mode !== 'editing'}
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
              disabled={mode !== 'editing'}
            />
          </div>

          {/* Output Panel */}
          <div className="border border-gray-700 rounded-lg">
            <div className="border-b border-gray-700 p-4">
              <h2 className="font-semibold">Output</h2>
            </div>
            <div 
              contentEditable={mode === 'awaiting-input'}
              onKeyDown={handleOutputInput}
              className={`p-4 font-mono h-[500px] overflow-auto whitespace-pre-wrap 
                ${mode === 'awaiting-input' ? 'border-2 border-green-500' : ''}`}
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