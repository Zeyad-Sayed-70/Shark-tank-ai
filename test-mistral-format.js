const axios = require('axios');

// Test the exact format expected by the Mistral proxy
async function testMistralFormat() {
  const endpoint = 'http://213.199.33.174:8000/v1/mistral/chat';
  
  console.log('Testing Mistral API format...\n');
  
  // Test 1: Minimal request (no history)
  console.log('=== Test 1: Minimal Request (No History) ===');
  try {
    const payload1 = {
      prompt: 'Hello, how are you?',
      instructions: 'You are a helpful assistant.',
      conversation_history: [],
      model: 'mistral-large-latest',
      temperature: 0.5,
      max_tokens: 8096,
      top_p: 1.0,
      stream: false,
      reset_conversation: false,
      // cookie: 'your_cookie_here', // Add if you have it
    };
    
    console.log('Request payload:', JSON.stringify(payload1, null, 2));
    
    const response1 = await axios.post(endpoint, payload1);
    console.log('✅ Success!');
    console.log('Response:', response1.data);
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: With conversation history
  console.log('=== Test 2: With Conversation History ===');
  try {
    const payload2 = {
      prompt: 'What did I just ask you?',
      instructions: 'You are a helpful assistant.',
      conversation_history: [
        {
          object: 'entry',
          type: 'message.input',
          role: 'user',
          content: 'Hello, how are you?',
          prefix: false,
        },
        {
          object: 'entry',
          type: 'message.output',
          role: 'assistant',
          content: 'I am doing well, thank you for asking!',
          model: 'mistral-large-latest',
          prefix: false,
        },
      ],
      model: 'mistral-large-latest',
      temperature: 0.5,
      max_tokens: 8096,
      top_p: 1.0,
      stream: false,
      reset_conversation: false,
      // cookie: 'your_cookie_here', // Add if you have it
    };
    
    console.log('Request payload:', JSON.stringify(payload2, null, 2));
    
    const response2 = await axios.post(endpoint, payload2);
    console.log('✅ Success!');
    console.log('Response:', response2.data);
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Exact format from your example
  console.log('=== Test 3: Format from Your Example ===');
  try {
    const payload3 = {
      prompt: 'Could make it more simple',
      instructions: 'Provide detailed, well-researched answers with citations.',
      tools: [
        {
          type: 'web_search_premium',
          open_results: false,
        },
        {
          type: 'code_interpreter',
        },
      ],
      top_p: 1.0,
      temperature: 0.5,
      max_tokens: 8096,
      stream: false,
      model: 'mistral-large-latest',
      conversation_name: 'ml_guide_creation',
      reset_conversation: false,
      conversation_history: [
        {
          object: 'entry',
          type: 'message.input',
          role: 'user',
          content: 'What is Python?',
          prefix: false,
        },
        {
          object: 'entry',
          type: 'message.output',
          model: 'mistral-large-latest',
          role: 'assistant',
          content: 'Python is a high-level, interpreted programming language known for its simplicity and readability.',
          prefix: false,
        },
      ],
      // cookie: 'your_cookie_here', // Add if you have it
    };
    
    console.log('Request payload:', JSON.stringify(payload3, null, 2));
    
    const response3 = await axios.post(endpoint, payload3);
    console.log('✅ Success!');
    console.log('Response:', response3.data);
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

testMistralFormat();
