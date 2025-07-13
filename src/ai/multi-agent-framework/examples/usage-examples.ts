/**
 * @fileOverview Usage examples for the Multi-Agent Framework
 */

import { createMultiAgentFramework, NewspaperAnalysisRequest, QuizGenerationRequest } from '../index';

/**
 * Example 1: Basic Framework Setup and Newspaper Analysis
 */
export async function exampleBasicNewspaperAnalysis() {
  console.log('🤖 Multi-Agent Framework Example: Newspaper Analysis');
  console.log('='.repeat(60));

  // Initialize framework
  const framework = createMultiAgentFramework({
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    },
    monitoring: {
      enableLogging: true,
      enableMetrics: true
    }
  });

  try {
    // Start the framework
    await framework.start();
    console.log('✅ Framework started successfully');

    // Create newspaper analysis request
    const request: NewspaperAnalysisRequest = {
      id: 'demo_news_001',
      userId: 'user_123',
      timestamp: Date.now(),
      type: 'newspaper_analysis',
      data: {
        sourceText: `The Supreme Court of India today delivered a landmark judgment on digital privacy rights, expanding the scope of Article 21 of the Constitution. The five-judge bench unanimously held that citizens have a fundamental right to digital privacy and data protection.
        
        The court emphasized that in the digital age, personal data is as valuable as physical property and requires constitutional protection. The judgment addresses concerns about data collection by both government agencies and private corporations.
        
        The decision is expected to have significant implications for pending data protection legislation and could influence how technology companies operate in India. Legal experts have hailed this as a progressive step toward comprehensive data governance.`,
        analysisType: 'comprehensive',
        examType: 'UPSC Civil Services',
        outputLanguage: 'English'
      }
    };

    console.log('\n📰 Analyzing newspaper article...');
    
    // Process request through framework
    const response = await framework.processRequest(request);
    
    if (response.success) {
      console.log('\n✅ Analysis completed successfully!');
      console.log('\n📊 Results:');
      console.log(`- Relevance Score: ${response.data?.relevanceScore || 'N/A'}`);
      console.log(`- Questions Generated: ${response.data?.questions?.length || 0}`);
      console.log(`- Processing Time: ${response.processingTime}ms`);
      console.log(`- Syllabus Topic: ${response.data?.syllabusTopic || 'N/A'}`);
      
      if (response.data?.questions?.length > 0) {
        console.log('\n📝 Sample Question:');
        const sampleQ = response.data.questions[0];
        console.log(`Q: ${sampleQ.question}`);
        if (sampleQ.options) {
          sampleQ.options.forEach((opt: string) => console.log(`   ${opt}`));
        }
      }
    } else {
      console.log('❌ Analysis failed:', response.error);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await framework.shutdown();
    console.log('\n🔄 Framework shutdown completed');
  }
}

/**
 * Example 2: Quiz Generation
 */
export async function exampleQuizGeneration() {
  console.log('\n🧩 Multi-Agent Framework Example: Quiz Generation');
  console.log('='.repeat(60));

  const framework = createMultiAgentFramework({
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
      temperature: 0.4
    }
  });

  try {
    await framework.start();
    console.log('✅ Framework started successfully');

    // Create quiz generation request
    const request: QuizGenerationRequest = {
      id: 'demo_quiz_001',
      userId: 'user_123',
      timestamp: Date.now(),
      type: 'quiz_generation',
      data: {
        topic: 'Indian Constitution - Fundamental Rights',
        difficulty: 'medium',
        questionCount: 5,
        questionType: 'mcq',
        syllabus: 'UPSC GS Paper II - Indian Constitution—historical underpinnings, evolution, features, amendments, significant provisions and basic structure'
      }
    };

    console.log('\n🧩 Generating quiz questions...');
    
    const response = await framework.processRequest(request);
    
    if (response.success) {
      console.log('\n✅ Quiz generated successfully!');
      console.log('\n📊 Quiz Metadata:');
      console.log(`- Total Questions: ${response.data?.metadata?.totalQuestions || 0}`);
      console.log(`- Estimated Time: ${response.data?.metadata?.estimatedTime || 0} seconds`);
      console.log(`- Quality Score: ${response.data?.metadata?.qualityScore?.toFixed(2) || 'N/A'}`);
      
      if (response.data?.questions?.length > 0) {
        console.log('\n📝 Sample Questions:');
        response.data.questions.slice(0, 2).forEach((q: any, idx: number) => {
          console.log(`\n${idx + 1}. ${q.question}`);
          if (q.options) {
            q.options.forEach((opt: string) => console.log(`   ${opt}`));
          }
          console.log(`   Difficulty: ${q.difficulty} | Time: ${q.timeEstimate}s`);
        });
      }
    } else {
      console.log('❌ Quiz generation failed:', response.error);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await framework.shutdown();
  }
}

/**
 * Example 3: Framework Statistics and Monitoring
 */
export async function exampleFrameworkMonitoring() {
  console.log('\n📊 Multi-Agent Framework Example: Monitoring & Stats');
  console.log('='.repeat(60));

  const framework = createMultiAgentFramework({
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    },
    monitoring: {
      enableMetrics: true,
      enableLogging: true
    }
  });

  try {
    await framework.start();
    
    // Get initial stats
    console.log('\n📈 Initial Framework Stats:');
    const initialStats = framework.getStats();
    console.log(`- Total Agents: ${initialStats.agents.totalAgents}`);
    console.log(`- Active Agents: ${initialStats.agents.activeAgents}`);
    console.log(`- Framework Initialized: ${initialStats.framework.initialized}`);

    // Process a few requests to generate metrics
    const requests = [
      {
        id: 'req_1',
        userId: 'user_123',
        timestamp: Date.now(),
        type: 'newspaper_analysis',
        data: {
          sourceText: 'Sample article about economic policy...',
          analysisType: 'summary',
          examType: 'UPSC Civil Services',
          outputLanguage: 'English'
        }
      },
      {
        id: 'req_2',
        userId: 'user_456',
        timestamp: Date.now(),
        type: 'quiz_generation',
        data: {
          topic: 'Geography',
          difficulty: 'easy',
          questionCount: 3,
          questionType: 'mcq'
        }
      }
    ];

    console.log('\n🔄 Processing sample requests...');
    
    for (const request of requests) {
      try {
        const response = await framework.processRequest(request as any);
        console.log(`✅ Request ${request.id}: ${response.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ Request ${request.id}: Failed`);
      }
    }

    // Get updated stats
    console.log('\n📊 Updated Framework Stats:');
    const finalStats = framework.getStats();
    console.log(`- System Load: ${finalStats.system.systemLoad.toFixed(2)}`);
    console.log(`- Total Requests: ${finalStats.system.totalRequests}`);
    console.log(`- Average Response Time: ${finalStats.system.averageResponseTime.toFixed(0)}ms`);
    console.log(`- Error Rate: ${(finalStats.system.errorRate * 100).toFixed(1)}%`);

    // Agent-specific metrics
    console.log('\n🤖 Agent Metrics:');
    const agentRegistry = framework.getAgentRegistry();
    const agentMetrics = agentRegistry.getAgentMetrics();
    
    agentMetrics.forEach(metric => {
      console.log(`\n${metric.agentId}:`);
      console.log(`  - Total Requests: ${metric.totalRequests}`);
      console.log(`  - Success Rate: ${((metric.successfulRequests / metric.totalRequests) * 100).toFixed(1)}%`);
      console.log(`  - Avg Latency: ${metric.averageLatency.toFixed(0)}ms`);
      console.log(`  - Last Activity: ${metric.lastActivity.toLocaleTimeString()}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await framework.shutdown();
  }
}

/**
 * Example 4: Agent Health Monitoring
 */
export async function exampleHealthMonitoring() {
  console.log('\n🏥 Multi-Agent Framework Example: Health Monitoring');
  console.log('='.repeat(60));

  const framework = createMultiAgentFramework({
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    }
  });

  try {
    await framework.start();
    
    const agentRegistry = framework.getAgentRegistry();
    
    console.log('\n🔍 Performing health check...');
    const healthResults = await agentRegistry.performHealthCheck();
    
    console.log('\n🏥 Health Check Results:');
    for (const [agentId, isHealthy] of healthResults) {
      const status = isHealthy ? '✅ Healthy' : '❌ Unhealthy';
      console.log(`- ${agentId}: ${status}`);
    }

    // Get detailed agent info
    console.log('\n📋 Agent Details:');
    const activeAgents = agentRegistry.getActiveAgents();
    
    activeAgents.forEach(agent => {
      const metadata = agent.getMetadata();
      console.log(`\n${metadata.name} (${metadata.id}):`);
      console.log(`  - Version: ${metadata.version}`);
      console.log(`  - Category: ${metadata.category}`);
      console.log(`  - Status: ${metadata.status}`);
      console.log(`  - Capabilities: ${metadata.capabilities.length}`);
      console.log(`  - Resource Requirements:`);
      console.log(`    * Max Tokens: ${metadata.resourceRequirements.maxTokens}`);
      console.log(`    * Est. Latency: ${metadata.resourceRequirements.estimatedLatency}ms`);
      console.log(`    * Memory: ${metadata.resourceRequirements.memoryUsage}MB`);
      console.log(`    * Cost/Request: $${metadata.resourceRequirements.costPerRequest}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await framework.shutdown();
  }
}

/**
 * Example 5: Intent Classification Demo
 */
export async function exampleIntentClassification() {
  console.log('\n🎯 Multi-Agent Framework Example: Intent Classification');
  console.log('='.repeat(60));

  const framework = createMultiAgentFramework({
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
    }
  });

  try {
    await framework.start();

    // Test various request types to see how orchestrator routes them
    const testRequests = [
      {
        description: 'Newspaper Analysis Request',
        request: {
          id: 'intent_test_1',
          userId: 'user_123',
          timestamp: Date.now(),
          type: 'newspaper_analysis',
          data: {
            sourceText: 'Article about government budget allocation...',
            analysisType: 'comprehensive',
            examType: 'UPSC Civil Services',
            outputLanguage: 'English'
          }
        }
      },
      {
        description: 'Quiz Generation Request',
        request: {
          id: 'intent_test_2',
          userId: 'user_123',
          timestamp: Date.now(),
          type: 'quiz_generation',
          data: {
            topic: 'Science and Technology',
            difficulty: 'hard',
            questionCount: 8,
            questionType: 'mcq'
          }
        }
      }
    ];

    for (const testCase of testRequests) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      
      try {
        const response = await framework.processRequest(testCase.request as any);
        
        console.log(`✅ Success: ${response.success}`);
        console.log(`🕒 Processing Time: ${response.processingTime}ms`);
        console.log(`🤖 Handled by Agent: ${response.agentId}`);
        
        if (response.metadata?.orchestratorInfo) {
          const orchestratorInfo = response.metadata.orchestratorInfo;
          console.log(`🎯 Primary Intent: ${orchestratorInfo.intentClassification?.primaryIntent?.name}`);
          console.log(`📊 Intent Confidence: ${orchestratorInfo.intentClassification?.confidence?.toFixed(2)}`);
          console.log(`🔀 Execution Strategy: ${orchestratorInfo.executionStrategy}`);
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await framework.shutdown();
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running All Multi-Agent Framework Examples');
  console.log('='.repeat(80));

  try {
    await exampleBasicNewspaperAnalysis();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause

    await exampleQuizGeneration();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await exampleFrameworkMonitoring();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await exampleHealthMonitoring();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await exampleIntentClassification();

    console.log('\n🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Examples failed:', error);
  }
}

// CLI support
if (require.main === module) {
  const exampleName = process.argv[2];
  
  const examples: Record<string, () => Promise<void>> = {
    'newspaper': exampleBasicNewspaperAnalysis,
    'quiz': exampleQuizGeneration,
    'monitoring': exampleFrameworkMonitoring,
    'health': exampleHealthMonitoring,
    'intent': exampleIntentClassification,
    'all': runAllExamples
  };

  const example = examples[exampleName || 'all'];
  
  if (example) {
    example().catch(console.error);
  } else {
    console.log('Available examples:', Object.keys(examples).join(', '));
    console.log('Usage: npx tsx examples/usage-examples.ts [example-name]');
  }
}