# Requirements Document: Shark Tank AI Assistant Frontend

## Introduction

The Shark Tank AI Assistant Frontend is a React-based web application that provides an immersive, high-stakes interface for interacting with a Shark Tank-focused AI agent. The application connects to a backend API that queries a vector database containing comprehensive Shark Tank show data. The frontend delivers a command center experience with an aquatic, premium aesthetic that mirrors the intensity and drama of the show.

## Glossary

- **Agent**: The AI system that processes user queries and returns Shark Tank information
- **Session**: A persistent conversation context identified by a unique sessionId
- **Deal_Card**: A UI component displaying structured information about a specific Shark Tank deal
- **Shark_Indicator**: A visual element representing one of the main Sharks that highlights when mentioned
- **Context_Panel**: The right sidebar that displays dynamic deal information based on conversation
- **Chat_Interface**: The central messaging component for user-agent interaction
- **Job**: An asynchronous task tracked by jobId when queries exceed timeout thresholds
- **Glassmorphism**: A design style using transparency, blur, and layering to create glass-like effects
- **SSE**: Server-Sent Events, a protocol for real-time streaming from server to client

## Requirements

### Requirement 1: Chat Interface

**User Story:** As a user, I want to send messages to the AI agent and view conversation history, so that I can ask questions about Shark Tank and maintain context throughout the conversation.

#### Acceptance Criteria

1. WHEN a user types a message and submits it, THE Chat_Interface SHALL send the message to the backend API and display it in the conversation history
2. WHEN the Agent is processing a request, THE Chat_Interface SHALL display a themed loading animation with messages like "Crunching the numbers..." or "Consulting the Sharks..."
3. WHEN the Agent returns a response, THE Chat_Interface SHALL display the response in the conversation history with proper formatting
4. WHEN a conversation exists, THE Chat_Interface SHALL persist the sessionId across page refreshes
5. THE Chat_Interface SHALL display all messages in chronological order with clear visual distinction between user and agent messages
6. WHEN the user scrolls through history, THE Chat_Interface SHALL automatically scroll to the newest message when a new response arrives

### Requirement 2: API Integration

**User Story:** As a developer, I want to integrate with the backend API endpoints, so that the application can communicate with the AI agent and handle various response patterns.

#### Acceptance Criteria

1. WHEN sending a chat message, THE API_Client SHALL use the POST /agent/chat/sync endpoint as the primary communication method
2. WHEN a synchronous request times out (>60 seconds), THE API_Client SHALL receive a jobId and switch to polling the GET /agent/queue/job/:jobId/result endpoint
3. WHEN polling for job results, THE API_Client SHALL check the job status every 2-3 seconds until completion or failure
4. THE API_Client SHALL include sessionId in all requests to maintain conversation context
5. WHEN an API request fails, THE API_Client SHALL return structured error information including error type and user-friendly message
6. THE API_Client SHALL set appropriate timeout values (60 seconds for sync, 5 seconds for polling requests)

### Requirement 3: Session Management

**User Story:** As a user, I want my conversation to persist across page refreshes and have the ability to start new conversations, so that I can continue where I left off or start fresh.

#### Acceptance Criteria

1. WHEN a user starts a new conversation, THE Session_Manager SHALL generate or receive a sessionId from the backend
2. WHEN a page refresh occurs, THE Session_Manager SHALL restore the previous sessionId from local storage
3. WHEN a user requests to start a new session, THE Session_Manager SHALL clear the current sessionId and conversation history
4. THE Session_Manager SHALL store the sessionId in browser local storage immediately after creation
5. WHEN retrieving session history, THE Session_Manager SHALL call GET /agent/session/:sessionId to restore previous messages

### Requirement 4: Dynamic Context Panel

**User Story:** As a user, I want to see relevant deal information automatically displayed when the AI mentions specific deals or companies, so that I can quickly understand the context without asking follow-up questions.

#### Acceptance Criteria

1. WHEN the Agent response mentions a specific deal or company, THE Context_Panel SHALL parse the response and extract structured deal information
2. WHEN deal information is extracted, THE Context_Panel SHALL display a Deal_Card with entrepreneur name, ask amount, deal amount, equity percentage, and valuation
3. WHEN multiple deals are mentioned in a conversation, THE Context_Panel SHALL display the most recently mentioned deal
4. WHEN no deal is currently in context, THE Context_Panel SHALL display a placeholder state with instructions or recent deals
5. THE Context_Panel SHALL update smoothly with fade-in animations when new deal information appears

### Requirement 5: Shark Indicators

**User Story:** As a user, I want to see which Sharks are being discussed in the conversation, so that I can quickly identify the key players in any deal or topic.

#### Acceptance Criteria

1. THE Shark_Indicator SHALL display icons or avatars for all main Sharks (Mark Cuban, Kevin O'Leary, Lori Greiner, Barbara Corcoran, Robert Herjavec, Daymond John)
2. WHEN the Agent response mentions a specific Shark by name, THE Shark_Indicator SHALL highlight or animate that Shark's icon
3. WHEN multiple Sharks are mentioned, THE Shark_Indicator SHALL highlight all mentioned Sharks simultaneously
4. THE Shark_Indicator SHALL return to neutral state after 3-5 seconds or when a new message is sent
5. WHEN a Shark is highlighted, THE Shark_Indicator SHALL use a glow effect or color change consistent with the design system

### Requirement 6: Visual Design System

**User Story:** As a user, I want an immersive, high-stakes visual experience that reflects the drama and intensity of Shark Tank, so that using the application feels engaging and premium.

#### Acceptance Criteria

1. THE Application SHALL use a dark mode color palette with Deep Ocean Blue (#001f3f or #0a192f) as the primary background
2. THE Application SHALL use Money Green (#2ecc71) for positive indicators (accepted deals, high valuations)
3. THE Application SHALL use Alert Red (#e74c3c) for negative indicators (rejected deals, "I'm out" statements)
4. THE Application SHALL use Metallic Gold (#f1c40f) for accent elements (Shark net worth, royalty deals)
5. THE Application SHALL implement glassmorphism effects using transparency, backdrop blur, and subtle borders
6. THE Application SHALL use bold, condensed sans-serif fonts for headers and clean monospaced fonts for body text
7. WHEN elements appear or change, THE Application SHALL use smooth animations with durations between 200-400ms

### Requirement 7: Landing Page Experience

**User Story:** As a user, I want a cinematic entrance experience when I first visit the application, so that I feel immersed in the Shark Tank environment from the start.

#### Acceptance Criteria

1. WHEN a user first visits the application, THE Landing_Page SHALL display a full-screen entrance experience
2. THE Landing_Page SHALL include a prominent input prompt with text like "State your business." or "Make your pitch."
3. WHEN the user submits their first message, THE Landing_Page SHALL transition to the main dashboard with an animation
4. THE Landing_Page SHALL use aquatic or Shark Tank themed visual elements (water effects, tank imagery, or door opening animation)
5. WHEN the transition completes, THE Landing_Page SHALL be replaced by the main dashboard without page reload

### Requirement 8: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when errors occur or when the system is processing, so that I understand what's happening and can take appropriate action.

#### Acceptance Criteria

1. WHEN a network error occurs, THE Application SHALL display a user-friendly error message with retry options
2. WHEN an API request fails, THE Application SHALL distinguish between network errors, timeout errors, and server errors
3. WHEN a job is queued (async mode), THE Application SHALL display a status indicator showing "Processing in queue..."
4. WHEN polling for results, THE Application SHALL show progress indicators or estimated wait time if available
5. WHEN an error is recoverable, THE Application SHALL provide a clear action button (e.g., "Retry", "Start New Session")
6. THE Application SHALL log detailed error information to the browser console for debugging purposes

### Requirement 9: Responsive Design

**User Story:** As a user on different devices, I want the application to adapt to my screen size, so that I can use it effectively on desktop, tablet, or mobile.

#### Acceptance Criteria

1. THE Application SHALL prioritize desktop layout (1280px and above) as the primary experience
2. WHEN viewed on tablet (768px - 1279px), THE Application SHALL stack the Context_Panel below the Chat_Interface or make it collapsible
3. WHEN viewed on mobile (<768px), THE Application SHALL display a single-column layout with the Chat_Interface as primary focus
4. WHEN on mobile, THE Application SHALL provide a toggle button to show/hide the Context_Panel and Shark_Indicators
5. THE Application SHALL maintain touch-friendly tap targets (minimum 44x44px) on mobile devices
6. THE Application SHALL use responsive typography that scales appropriately across breakpoints

### Requirement 10: State Management

**User Story:** As a developer, I want a clear state management solution, so that application state is predictable, debuggable, and maintainable.

#### Acceptance Criteria

1. THE State_Manager SHALL maintain conversation history as an ordered array of message objects
2. THE State_Manager SHALL track loading states for API requests (idle, loading, success, error)
3. THE State_Manager SHALL store current sessionId and provide methods to update it
4. THE State_Manager SHALL maintain current context data for the Context_Panel
5. THE State_Manager SHALL track which Sharks are currently highlighted
6. THE State_Manager SHALL provide actions for adding messages, updating session, setting errors, and clearing state
7. WHEN state changes occur, THE State_Manager SHALL trigger re-renders only for affected components

### Requirement 11: Performance Optimization

**User Story:** As a user, I want the application to feel fast and responsive, so that I can interact with it smoothly without delays or janky animations.

#### Acceptance Criteria

1. WHEN a message is sent, THE Application SHALL display the user's message immediately (optimistic update)
2. THE Application SHALL debounce rapid user inputs to prevent excessive API calls
3. THE Application SHALL lazy-load components that are not immediately visible (e.g., Context_Panel details)
4. THE Application SHALL use React.memo or similar optimization for components that render frequently
5. WHEN animations run, THE Application SHALL maintain 60fps frame rate on modern devices
6. THE Application SHALL limit conversation history display to the most recent 50 messages with "load more" functionality

### Requirement 12: Accessibility

**User Story:** As a user with accessibility needs, I want the application to be usable with keyboard navigation and screen readers, so that I can access all functionality.

#### Acceptance Criteria

1. THE Application SHALL support full keyboard navigation with visible focus indicators
2. THE Chat_Interface SHALL be accessible via Tab key and messages submittable via Enter key
3. THE Application SHALL use semantic HTML elements (nav, main, aside, article) for proper structure
4. THE Application SHALL provide ARIA labels for icon-only buttons and interactive elements
5. WHEN loading states occur, THE Application SHALL announce status changes to screen readers using ARIA live regions
6. THE Application SHALL maintain color contrast ratios of at least 4.5:1 for text content
