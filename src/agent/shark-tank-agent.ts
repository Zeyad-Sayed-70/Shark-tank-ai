import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { createSharkTankSearchTool } from './tools/shark-tank-search.tool';
import { createInternetSearchTool } from './tools/internet-search.tool';
import { createCalculatorTool } from './tools/calculator.tool';
import { lastValueFrom } from 'rxjs';

// Define the state structure
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
});

export class SharkTankAgent {
  private graph: any;
  private tools: any[];
  private systemPrompt: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.systemPrompt = `You are a Shark Tank expert and business analyst. Your PRIMARY role is to answer questions using the Shark Tank database.

CRITICAL: For ANY question about Shark Tank, you MUST use the shark_tank_search tool first to get accurate data from the database.

Key responsibilities:
- ALWAYS search the database for Shark Tank questions
- Analyze pitch strategies and deal outcomes using real data
- Explain business valuations and financial terms with examples
- Provide insights on investor behavior with specific cases
- Track company success stories with database information

Tool usage:
- shark_tank_search: Use for ALL Shark Tank questions (companies, deals, investors, pitches, etc.)
- calculator: Use only for mathematical calculations
- internet_search: Use only for current news or updates about companies

Be conversational and educational, but ALWAYS base your answers on database search results!`;

    this.initializeTools();
    this.buildGraph();
  }

  private initializeTools() {
    const baseUrl = this.configService.get<string>('app.url') || 'http://localhost:3000';
    
    this.tools = [
      createSharkTankSearchTool(this.httpService, baseUrl),
      createInternetSearchTool(this.httpService),
      createCalculatorTool(),
    ];
  }

  private async callModel(state: typeof AgentState.State): Promise<any> {
    const messages = state.messages;
    
    // Check if the last message is a tool result
    const lastMessage = messages[messages.length - 1];
    const hasToolResult = lastMessage.additional_kwargs?.tool_result;
    const toolExecuted = lastMessage.additional_kwargs?.tool_executed;
    
    // Build conversation history for Mistral API
    const conversationHistory: Array<any> = [];
    let currentPrompt = '';
    let toolResults = '';
    
    for (const msg of messages) {
      if (msg instanceof HumanMessage) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        // User message format (with prefix field)
        conversationHistory.push({
          object: 'entry',
          type: 'message.input',
          role: 'user',
          content: content,
          prefix: false,
        });
      } else if (msg instanceof AIMessage) {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        
        // If this message has tool results, store them separately
        if (msg.additional_kwargs?.tool_result && msg.additional_kwargs?.tool_executed) {
          toolResults = typeof msg.additional_kwargs.tool_result === 'string' 
            ? msg.additional_kwargs.tool_result 
            : JSON.stringify(msg.additional_kwargs.tool_result);
        } else if (content && content.trim() && !msg.additional_kwargs?.tool_calls) {
          // Only add actual assistant responses (not tool calls)
          // Assistant message format (no prefix field)
          conversationHistory.push({
            object: 'entry',
            type: 'message.output',
            model: 'mistral-large-latest',
            role: 'assistant',
            content: content,
          });
        }
      }
    }
    
    // If we just got a tool result, generate final response (ALWAYS, even if empty/error)
    if (hasToolResult && toolExecuted) {
      // Get the last user message
      const lastUserMessage = conversationHistory
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';
      
      // Build prompt with tool results
      currentPrompt = toolResults 
        ? `Based on these search results:\n\n${toolResults}\n\nAnswer the user's question: ${lastUserMessage}`
        : `The search returned no results. Please answer the user's question using your general knowledge: ${lastUserMessage}`;
      
      console.log('Tool result received, generating final response...');
      
      // Generate response from Mistral
      const mistralEndpoint = this.configService.get<string>('mistral.endpoint');
      const mistralCookie = this.configService.get<string>('mistral.cookie');
      
      if (!mistralEndpoint) {
        return {
          messages: [
            new AIMessage(
              'I apologize, but the AI service is not configured. Please contact support.',
            ),
          ],
          next: END,
        };
      }
      
      try {
        // CRITICAL FIX: Remove the last user message from history since we're including it in the prompt
        // This prevents duplicate messages that cause 422 errors
        let cleanHistory = conversationHistory.slice(0, -1);
        
        // Limit conversation history to last 4 turns (8 messages) to avoid payload size issues
        const MAX_HISTORY_MESSAGES = 8;
        if (cleanHistory.length > MAX_HISTORY_MESSAGES) {
          cleanHistory = cleanHistory.slice(-MAX_HISTORY_MESSAGES);
        }
        
        // Ensure all history entries have required fields and proper format
        const validatedHistory = cleanHistory.filter(entry => {
          return entry.content && 
                 entry.content.trim().length > 0 && 
                 entry.role && 
                 (entry.role === 'user' || entry.role === 'assistant');
        });
        
        console.log('Mistral API call with history:', {
          historyLength: validatedHistory.length,
          hasToolResults: !!toolResults,
          promptLength: currentPrompt.length,
        });

        
        // Build payload in exact order as the working example
        const payload: any = {
          prompt: currentPrompt,
          instructions: this.systemPrompt,
        };

        
        // Add parameters in exact order
        payload.top_p = 1.0;
        payload.temperature = 0.5;
        payload.max_tokens = 8096;
        payload.stream = false;
        payload.model = 'mistral-large-latest';
        
        payload.reset_conversation = false;
        payload.conversation_history = validatedHistory;
        
        // Add cookie if available (MUST be last)
        if (mistralCookie) {
          payload.cookie = mistralCookie;
        }
        
        console.log('Mistral request payload:', JSON.stringify(payload, null, 2))
        console.log('Mistral request - History items:', validatedHistory.length, 'Prompt length:', currentPrompt.length);
        
        const response = await lastValueFrom(
          this.httpService.post(mistralEndpoint, payload),
        );

        let aiResponse = response.data.content || response.data.response;
        
        // Clean up the response
        if (aiResponse) {
          aiResponse = aiResponse.trim();
        }

        console.log('Final response generated, ending conversation');

        return {
          messages: [new AIMessage(aiResponse)],
          next: END,
        };
      } catch (error) {
        console.error('Mistral API Error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return {
          messages: [
            new AIMessage(
              'I apologize, but I encountered an error processing your request. Please try again.',
            ),
          ],
          next: END,
        };
      }
    }

    // Determine if we should use tools (only for initial user message, not after tool execution)
    if (!hasToolResult && !toolExecuted && lastMessage instanceof HumanMessage) {
      const shouldUseTool = this.shouldUseTool(lastMessage.content as string);

      if (shouldUseTool) {
        const toolDecision = await this.decideToolUsage(lastMessage.content as string);
        
        if (toolDecision.useTool && toolDecision.toolName) {
          console.log(`Using tool: ${toolDecision.toolName}`, toolDecision.arguments);
          
          return {
            messages: [
              new AIMessage({
                content: '',
                additional_kwargs: {
                  tool_calls: [{
                    id: `call_${Date.now()}`,
                    type: 'function',
                    function: {
                      name: toolDecision.toolName,
                      arguments: JSON.stringify(toolDecision.arguments || {}),
                    },
                  }],
                },
              }),
            ],
            next: 'tools',
          };
        }
      }
    }

    // Generate response without tools (shouldn't reach here normally)
    const lastUserMessage = conversationHistory
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';
    
    currentPrompt = lastUserMessage;
    
    const mistralEndpoint = this.configService.get<string>('mistral.endpoint');
    const mistralCookie = this.configService.get<string>('mistral.cookie');
    
    if (!mistralEndpoint) {
      return {
        messages: [
          new AIMessage(
            'I apologize, but the AI service is not configured. Please contact support.',
          ),
        ],
        next: END,
      };
    }
    
    try {
      // CRITICAL FIX: Remove the last user message from history since we're including it in the prompt
      let cleanHistory = conversationHistory.slice(0, -1);
      
      // Limit conversation history to last 4 turns (8 messages) to avoid payload size issues
      const MAX_HISTORY_MESSAGES = 8;
      if (cleanHistory.length > MAX_HISTORY_MESSAGES) {
        cleanHistory = cleanHistory.slice(-MAX_HISTORY_MESSAGES);
      }
      
      // Ensure all history entries have required fields and proper format
      const validatedHistory = cleanHistory.filter(entry => {
        return entry.content && 
               entry.content.trim().length > 0 && 
               entry.role && 
               (entry.role === 'user' || entry.role === 'assistant');
      });
      
      console.log('Mistral API call (no tools):', {
        historyLength: validatedHistory.length,
        promptLength: currentPrompt.length,
      });
      
      // Build payload in exact order as the working example
      const payload: any = {
        prompt: currentPrompt,
        instructions: this.systemPrompt,
      };

      // Add parameters in exact order
      payload.top_p = 1.0;
      payload.temperature = 0.5;
      payload.max_tokens = 8096;
      payload.stream = false;
      payload.model = 'mistral-large-latest';
      
      payload.reset_conversation = false;
      payload.conversation_history = validatedHistory;

      // Add cookie if available (MUST be last)
      if (mistralCookie) {
        payload.cookie = mistralCookie;
      }

      console.log('Mistral request - History items:', validatedHistory.length, 'Prompt length:', currentPrompt.length);
      
      const response = await lastValueFrom(
        this.httpService.post(mistralEndpoint, payload),
      );

      let aiResponse = response.data.content || response.data.response;
      
      // Clean up the response
      if (aiResponse) {
        aiResponse = aiResponse.trim();
      }

      return {
        messages: [new AIMessage(aiResponse)],
        next: END,
      };
    } catch (error) {
      console.error('Mistral API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        messages: [
          new AIMessage(
            'I apologize, but I encountered an error processing your request. Please try again.',
          ),
        ],
        next: END,
      };
    }
  }

  private shouldUseTool(userMessage: string): boolean {
    // ALWAYS use tools for Shark Tank questions
    // The agent's primary purpose is to answer using database
    return true;
  }

  private async decideToolUsage(userMessage: string): Promise<{
    useTool: boolean;
    toolName?: string;
    arguments?: any;
  }> {
    const lowerMessage = userMessage.toLowerCase();

    // Check for calculator needs (explicit math operations)
    if (
      /\d+/.test(userMessage) &&
      (lowerMessage.includes('calculate') ||
        lowerMessage.includes('compute') ||
        lowerMessage.includes('what is') && /[\d+\-*/().%^]+/.test(userMessage))
    ) {
      const mathMatch = userMessage.match(/[\d+\-*/().%^]+/);
      if (mathMatch) {
        return {
          useTool: true,
          toolName: 'calculator',
          arguments: { expression: mathMatch[0] },
        };
      }
    }

    // Check for internet search needs (current/recent news only)
    if (
      lowerMessage.includes('current') ||
      lowerMessage.includes('now') ||
      lowerMessage.includes('today') ||
      lowerMessage.includes('recent') ||
      lowerMessage.includes('latest') ||
      lowerMessage.includes('what happened to') ||
      lowerMessage.includes('where are they now') ||
      lowerMessage.includes('still in business') ||
      lowerMessage.includes('update')
    ) {
      return {
        useTool: true,
        toolName: 'internet_search',
        arguments: { query: userMessage, max_results: 5 },
      };
    }

    // DEFAULT: Use Shark Tank search for ALL other questions
    // This is the primary purpose of the agent
    return {
      useTool: true,
      toolName: 'shark_tank_search',
      arguments: { query: userMessage },
    };
  }

  private shouldContinue(state: typeof AgentState.State): string {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // Check if the last message has tool calls
    if (
      lastMessage instanceof AIMessage &&
      lastMessage.additional_kwargs?.tool_calls &&
      !lastMessage.additional_kwargs?.tool_result
    ) {
      return 'tools';
    }

    return END;
  }

  private buildGraph() {
    // Create custom tool node that properly formats results
    const toolNode = async (state: typeof AgentState.State) => {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage instanceof AIMessage && lastMessage.additional_kwargs?.tool_calls) {
        const toolCall = lastMessage.additional_kwargs.tool_calls[0];
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${toolName}`, toolArgs);
        
        // Find and execute the tool
        const tool = this.tools.find(t => t.name === toolName);
        
        if (tool) {
          try {
            const result = await tool.invoke(toolArgs);
            console.log(`Tool result received, length: ${JSON.stringify(result).length}`);
            
            // ALWAYS return result with tool_executed flag, even if empty or error
            // This ensures the loop terminates
            return {
              messages: [
                new AIMessage({
                  content: '',
                  additional_kwargs: {
                    tool_result: result || 'No results found',
                    tool_executed: true, // CRITICAL: Always set to prevent loop
                  },
                }),
              ],
            };
          } catch (error) {
            console.error(`Tool execution error:`, error.message);
            // Even on error, mark as executed to prevent loop
            return {
              messages: [
                new AIMessage({
                  content: '',
                  additional_kwargs: {
                    tool_result: `Error: ${error.message}`,
                    tool_executed: true, // CRITICAL: Always set to prevent loop
                  },
                }),
              ],
            };
          }
        }
      }
      
      // Fallback: mark as executed even if tool not found
      return {
        messages: [
          new AIMessage({
            content: '',
            additional_kwargs: {
              tool_result: 'Tool not found',
              tool_executed: true,
            },
          }),
        ],
      };
    };

    // Build the graph
    const workflow = new StateGraph(AgentState)
      .addNode('agent', (state) => this.callModel(state))
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', (state) => this.shouldContinue(state))
      .addEdge('tools', 'agent');

    this.graph = workflow.compile();
  }

  async chat(userMessage: string, conversationHistory: BaseMessage[] = []): Promise<string> {
    try {
      const messages = [...conversationHistory, new HumanMessage(userMessage)];

      const result = await this.graph.invoke({
        messages,
      });

      // Extract the final AI message
      const finalMessages = result.messages;
      
      // Find the last AI message with actual content (not tool calls)
      for (let i = finalMessages.length - 1; i >= 0; i--) {
        const msg = finalMessages[i];
        if (msg instanceof AIMessage) {
          const content = msg.content as string;
          // Skip empty messages or messages with only tool calls
          if (content && content.trim() && !msg.additional_kwargs?.tool_calls) {
            return content;
          }
        }
      }

      return 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Agent error:', error);
      return 'I encountered an error while processing your request. Please try again.';
    }
  }

  async stream(userMessage: string, conversationHistory: BaseMessage[] = []) {
    const messages = [...conversationHistory, new HumanMessage(userMessage)];

    return this.graph.stream({
      messages,
    });
  }
}
