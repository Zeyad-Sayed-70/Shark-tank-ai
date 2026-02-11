const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testConversations() {
  console.log('🧪 Testing Conversation API\n');

  try {
    // Test 1: Create a new conversation
    console.log('1️⃣ Creating a new conversation...');
    const createResponse = await axios.post(`${BASE_URL}/conversations`, {
      title: 'Test Conversation',
      userId: 'test-user-123',
      metadata: { source: 'test-script' }
    });
    console.log('✅ Conversation created:', createResponse.data.conversation.id);
    const conversationId = createResponse.data.conversation.id;
    console.log();

    // Test 2: Send first message
    console.log('2️⃣ Sending first message...');
    const message1 = await axios.post(`${BASE_URL}/conversations/${conversationId}/messages`, {
      message: 'Tell me about Scrub Daddy',
      userId: 'test-user-123'
    });
    console.log('✅ Message sent and response received');
    console.log('User:', message1.data.message.content);
    console.log('AI:', message1.data.response.content.substring(0, 100) + '...');
    console.log('Entities found:', message1.data.entities);
    console.log();

    // Test 3: Send follow-up message (testing conversation history)
    console.log('3️⃣ Sending follow-up message...');
    const message2 = await axios.post(`${BASE_URL}/conversations/${conversationId}/messages`, {
      message: 'What was the deal amount?',
      userId: 'test-user-123'
    });
    console.log('✅ Follow-up message sent');
    console.log('User:', message2.data.message.content);
    console.log('AI:', message2.data.response.content.substring(0, 100) + '...');
    console.log();

    // Test 4: Get conversation with full history
    console.log('4️⃣ Retrieving full conversation...');
    const getConv = await axios.get(`${BASE_URL}/conversations/${conversationId}`);
    console.log('✅ Conversation retrieved');
    console.log('Title:', getConv.data.conversation.title);
    console.log('Total messages:', getConv.data.conversation.messages.length);
    console.log('Companies mentioned:', getConv.data.conversation.metadata.companiesMentioned);
    console.log('Sharks mentioned:', getConv.data.conversation.metadata.sharksMentioned);
    console.log();

    // Test 5: Get all conversations
    console.log('5️⃣ Getting all conversations...');
    const allConvs = await axios.get(`${BASE_URL}/conversations?userId=test-user-123`);
    console.log('✅ Retrieved conversations:', allConvs.data.conversations.length);
    console.log();

    // Test 6: Update conversation title
    console.log('6️⃣ Updating conversation title...');
    const updateConv = await axios.put(`${BASE_URL}/conversations/${conversationId}`, {
      title: 'Scrub Daddy Discussion'
    });
    console.log('✅ Title updated to:', updateConv.data.conversation.title);
    console.log();

    // Test 7: Search conversations
    console.log('7️⃣ Searching conversations...');
    const search = await axios.get(`${BASE_URL}/conversations/search?q=Scrub&userId=test-user-123`);
    console.log('✅ Search results:', search.data.conversations.length);
    console.log();

    // Test 8: Get stats
    console.log('8️⃣ Getting conversation stats...');
    const stats = await axios.get(`${BASE_URL}/conversations/stats?userId=test-user-123`);
    console.log('✅ Stats retrieved:');
    console.log('Total conversations:', stats.data.stats.totalConversations);
    console.log('Total messages:', stats.data.stats.totalMessages);
    console.log('Average messages per conversation:', stats.data.stats.averageMessagesPerConversation);
    console.log();

    // Test 9: Send message with auto-create conversation
    console.log('9️⃣ Testing auto-create conversation...');
    const autoCreate = await axios.post(`${BASE_URL}/conversations/send`, {
      message: 'What are the most successful Shark Tank companies?',
      userId: 'test-user-123'
    });
    console.log('✅ New conversation auto-created:', autoCreate.data.conversationId);
    console.log('AI Response:', autoCreate.data.response.content.substring(0, 100) + '...');
    console.log();

    // Test 10: Delete conversation
    console.log('🔟 Deleting test conversation...');
    await axios.delete(`${BASE_URL}/conversations/${conversationId}`);
    console.log('✅ Conversation deleted');
    console.log();

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run tests
testConversations();
