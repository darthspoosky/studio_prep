
import { analyzeNewspaperArticle } from './flows/newspaper-analysis-flow';
import type { NewspaperAnalysisInput } from './flows/newspaper-analysis-flow';

// A simple test script to verify the streaming functionality of the newspaper analysis flow.
async function runTest() {
  console.log('--- Starting Newspaper Analysis Stream Test ---');

  const testInput: NewspaperAnalysisInput = {
    sourceText: `India's economy is projected to grow at 7% this fiscal year, according to the latest government estimates. The growth is driven by a strong performance in the services sector and increased government spending on infrastructure. However, challenges remain in the form of persistent inflation and global economic headwinds. The Reserve Bank of India is expected to maintain its current monetary policy stance in the upcoming review.`,
    examType: 'UPSC Civil Services',
    analysisFocus: 'Generate Questions (Mains & Prelims)',
    outputLanguage: 'English',
  };

  try {
    const result = await analyzeNewspaperArticle(testInput);

    if (!result) {
      console.error('Error: The run function did not return a result.');
      return;
    }

    console.log('\n--- Result Received ---');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('\n--- An error occurred during the test ---');
    console.error(error);
  } finally {
    console.log('\n--- Test Finished ---');
    // Genkit flows can sometimes keep the process alive. Exit explicitly.
    process.exit(0);
  }
}

runTest();
