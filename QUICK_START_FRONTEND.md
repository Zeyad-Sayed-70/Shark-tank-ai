# 🚀 Quick Start Guide for Frontend Developers

Get started with the Shark Tank AI Agent backend in 5 minutes.

## ✅ Prerequisites

- Backend server running on `http://localhost:3000`
- Redis running (for queue system)
- Qdrant database configured with Shark Tank data

## 🎯 Essential Endpoints

### 1. Chat with Entity Extraction (Primary)

```javascript
POST /agent/chat/sync

// Request
{
  "message": "Tell me about Scrub Daddy",
  "sessionId": "optional-session-id"
}

// Response
{
  "success": true,
  "response": "Scrub Daddy was pitched by Aaron Krause...",
  "sessionId": "session_123",
  "entities": {
    "deals": [{
      "company": "Scrub Daddy",
      "entrepreneur": "Aaron Krause",
      "askAmount": 100000,
      "dealAmount": 200000,
      "valuation": 1000000,
      "investors": ["Lori Greiner"],
      "dealMade": true
    }],
    "sharks": [{
      "name": "Lori Greiner",
      "slug": "lori-greiner",
      "mentioned": true
    }],
    "companies": ["Scrub Daddy"]
  }
}
```

**Use this for:** Main chat interface

---

### 2. Get Recent Deals (Context Panel)

```javascript
GET /deals/recent/list?limit=5

// Response
{
  "success": true,
  "deals": [
    {
      "company": "Scrub Daddy",
      "entrepreneur": "Aaron Krause",
      "dealAmount": 200000,
      "valuation": 1000000,
      "investors": ["Lori Greiner"]
    }
  ]
}
```

**Use this for:** Context panel placeholder when no deal is being discussed

---

### 3. Get All Sharks (Shark Indicators)

```javascript
GET /sharks

// Response
{
  "success": true,
  "sharks": [
    {
      "id": "mark-cuban",
      "name": "Mark Cuban",
      "netWorth": "$5.1 billion",
      "totalDeals": 85,
      "industries": ["Technology", "Sports"]
    }
  ]
}
```

**Use this for:** Initialize shark indicators on page load

---

### 4. Get Deal Details (On Demand)

```javascript
GET /deals/Scrub%20Daddy

// Response
{
  "success": true,
  "deal": {
    "company": "Scrub Daddy",
    "entrepreneur": "Aaron Krause",
    "askAmount": 100000,
    "askEquity": 10,
    "dealAmount": 200000,
    "dealEquity": 20,
    "valuation": 1000000,
    "investors": ["Lori Greiner"],
    "season": 4,
    "episode": 7,
    "dealMade": true,
    "industry": "Home & Garden",
    "description": "Smiley-faced sponge..."
  }
}
```

**Use this for:** Detailed deal modal/card

---

### 5. Get Deal Statistics (Dashboard)

```javascript
GET /deals/stats/summary

// Response
{
  "success": true,
  "stats": {
    "totalDeals": 1200,
    "successfulDeals": 650,
    "averageValuation": 2500000,
    "dealSuccessRate": 54.17,
    "topInvestor": "Mark Cuban",
    "topIndustry": "Food & Beverage"
  }
}
```

**Use this for:** Dashboard statistics

---

## 💻 React Example

```jsx
import { useState, useEffect } from 'react';

function SharkTankChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [currentDeal, setCurrentDeal] = useState(null);
  const [sharks, setSharks] = useState([]);
  const [recentDeals, setRecentDeals] = useState([]);

  // Load initial data
  useEffect(() => {
    loadSharks();
    loadRecentDeals();
  }, []);

  const loadSharks = async () => {
    const res = await fetch('http://localhost:3000/sharks');
    const data = await res.json();
    setSharks(data.sharks);
  };

  const loadRecentDeals = async () => {
    const res = await fetch('http://localhost:3000/deals/recent/list?limit=5');
    const data = await res.json();
    setRecentDeals(data.deals);
  };

  const sendMessage = async () => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    // Send to API
    const res = await fetch('http://localhost:3000/agent/chat/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });

    const data = await res.json();

    // Add AI response
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: data.response 
    }]);

    // Update session
    setSessionId(data.sessionId);

    // Handle entities
    if (data.entities) {
      // Update current deal for context panel
      if (data.entities.deals.length > 0) {
        setCurrentDeal(data.entities.deals[0]);
      }

      // Highlight mentioned sharks
      const mentionedSharks = data.entities.sharks
        .filter(s => s.mentioned)
        .map(s => s.slug);
      highlightSharks(mentionedSharks);
    }

    setMessage('');
  };

  const highlightSharks = (sharkSlugs) => {
    // Implement shark highlighting logic
    setSharks(prev => prev.map(shark => ({
      ...shark,
      highlighted: sharkSlugs.includes(shark.id)
    })));

    // Reset after 3 seconds
    setTimeout(() => {
      setSharks(prev => prev.map(shark => ({
        ...shark,
        highlighted: false
      })));
    }, 3000);
  };

  return (
    <div className="shark-tank-chat">
      {/* Shark Indicators */}
      <div className="shark-indicators">
        {sharks.map(shark => (
          <div 
            key={shark.id} 
            className={shark.highlighted ? 'highlighted' : ''}
          >
            <img src={shark.avatar} alt={shark.name} />
            <span>{shark.name}</span>
          </div>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>

      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="Ask about Shark Tank..."
      />

      {/* Context Panel */}
      <div className="context-panel">
        {currentDeal ? (
          <DealCard deal={currentDeal} />
        ) : (
          <div>
            <h3>Recent Deals</h3>
            {recentDeals.map(deal => (
              <DealCard key={deal.company} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal }) {
  return (
    <div className="deal-card">
      <h3>{deal.company}</h3>
      <p>Entrepreneur: {deal.entrepreneur}</p>
      <p>Ask: ${deal.askAmount.toLocaleString()} for {deal.askEquity}%</p>
      {deal.dealMade && (
        <p>Deal: ${deal.dealAmount.toLocaleString()} for {deal.dealEquity}%</p>
      )}
      <p>Valuation: ${deal.valuation.toLocaleString()}</p>
      <p>Investors: {deal.investors.join(', ')}</p>
    </div>
  );
}
```

---

## 🎨 UI Components to Build

### 1. Chat Interface
- Message list (user + assistant)
- Input field
- Loading indicator
- Session management

### 2. Context Panel (Right Sidebar)
- Deal card component
- Recent deals list
- Smooth transitions

### 3. Shark Indicators (Top Bar)
- 6 shark avatars
- Highlight animation
- Click for shark details

### 4. Deal Card
- Company name
- Entrepreneur
- Ask vs Deal amounts
- Valuation
- Investors
- Industry tag

---

## 🔄 Typical User Flow

1. **Page Load**
   ```javascript
   // Load sharks for indicators
   GET /sharks
   
   // Load recent deals for context panel
   GET /deals/recent/list?limit=5
   ```

2. **User Sends Message**
   ```javascript
   // Send chat message
   POST /agent/chat/sync
   {
     "message": "Tell me about Scrub Daddy",
     "sessionId": sessionId
   }
   ```

3. **Handle Response**
   ```javascript
   // Display AI response
   showMessage(response.response)
   
   // Update context panel with deal
   if (response.entities.deals.length > 0) {
     showDealCard(response.entities.deals[0])
   }
   
   // Highlight mentioned sharks
   const mentioned = response.entities.sharks
     .filter(s => s.mentioned)
   highlightSharks(mentioned)
   ```

4. **User Clicks Deal**
   ```javascript
   // Get full deal details
   GET /deals/Scrub%20Daddy
   
   // Show in modal
   showDealModal(deal)
   ```

---

## ⚠️ Error Handling

```javascript
try {
  const res = await fetch('http://localhost:3000/agent/chat/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });

  const data = await res.json();

  if (!data.success) {
    // Handle error
    if (res.status === 408) {
      // Timeout - switch to polling
      pollForResult(data.jobId);
    } else {
      showError(data.error || 'Something went wrong');
    }
  } else {
    // Success
    handleResponse(data);
  }
} catch (error) {
  // Network error
  showError('Network error. Please check your connection.');
}
```

---

## 🧪 Testing

```bash
# Test all endpoints
node test-new-endpoints.js

# Test specific endpoint
curl http://localhost:3000/sharks
curl http://localhost:3000/deals/recent/list?limit=5
```

---

## 📚 Full Documentation

- **[FRONTEND_API.md](./FRONTEND_API.md)** - Complete API reference
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Implementation details
- **[README.md](./README.md)** - Project overview

---

## 🎯 Key Points

1. **Always use `/agent/chat/sync`** for chat - it includes entity extraction
2. **Save sessionId** - needed for conversation context
3. **Handle entities** - they power the context panel and shark indicators
4. **Load sharks once** - on page load, then highlight based on mentions
5. **Show recent deals** - when no specific deal is being discussed
6. **Handle timeouts** - switch to polling if sync request times out

---

## 🚀 You're Ready!

With these 5 endpoints, you can build the complete frontend:
1. ✅ Chat with entity extraction
2. ✅ Recent deals for context panel
3. ✅ Sharks for indicators
4. ✅ Deal details on demand
5. ✅ Statistics for dashboard

**Start building and let the backend handle the rest!** 🎉
