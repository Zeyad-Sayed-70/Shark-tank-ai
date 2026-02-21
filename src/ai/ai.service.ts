import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateResponse(
    prompt: string,
    jsonSchema?: any,
    youtubeUrl?: string,
  ): Promise<any> {
    const aiEndpoint = this.configService.get<string>('ai.endpoint');

    if (!aiEndpoint) {
      throw new InternalServerErrorException('AI_ENDPOINT is not configured');
    }

    // Only request JSON response when we have a schema
    const requestJson = !!jsonSchema;

    const payload: any = {
      prompt,
      youtube_url: youtubeUrl,
      stream: false,
      browser_id: 0,
      model: youtubeUrl ? 'gemini-3-pro-preview' :'gemini-3-flash-preview',
      structuredOutputs: {
        enabled: requestJson,
        schema: jsonSchema || undefined,
      },
      codeExecution: false,
      googleSearch: false,
      urlContext: !!youtubeUrl,
      // temperature: 0.7,
      responseWithJson: true,
    };

    if (youtubeUrl) payload.mediaResolution = 'HIGH';

    try {
      const response = await lastValueFrom(
        this.httpService.post(aiEndpoint, payload),
      );

      const data = response.data;

      console.log(data)

      // Check for errors
      if (data.error) {
        throw new InternalServerErrorException(
          `AI Service returned error: ${data.error}`,
        );
      }

      // Handle response based on whether we requested JSON
      if (data.response) {
        if (requestJson) {
          // When responseWithJson: true, parse the JSON string
          try {
            return JSON.parse(data.response);
          } catch (parseError) {
            throw new InternalServerErrorException(
              `Failed to parse AI JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            );
          }
        } else {
          // When responseWithJson: false, return plain text
          return data.response;
        }
      }

      throw new InternalServerErrorException(
        'AI Service returned unexpected response format',
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `AI Service call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generateMistralResponse(
    prompt: string,
    instructions?: string,
    conversationHistory?: Array<{ role: string; content: string; type?: string; model?: string }>,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      tools?: any[];
      stream?: boolean;
      resetConversation?: boolean;
      conversationName?: string;
    },
  ): Promise<any> {
    const mistralEndpoint = this.configService.get<string>('mistral.endpoint');
    const mistralCookie = this.configService.get<string>('mistral.cookie');

    if (!mistralEndpoint) {
      throw new InternalServerErrorException('MISTRAL_ENDPOINT is not configured');
    }

    // Format conversation history to match Mistral API format EXACTLY
    const formattedHistory = (conversationHistory || []).map(msg => {
      if (msg.role === 'user') {
        // User message: with prefix field
        return {
          object: 'entry',
          type: msg.type || 'message.input',
          role: 'user',
          content: msg.content,
          prefix: false,
        };
      } else {
        // Assistant message: no prefix field
        return {
          object: 'entry',
          type: msg.type || 'message.output',
          model: msg.model || options?.model || 'mistral-large-latest',
          role: 'assistant',
          content: msg.content,
        };
      }
    });

    // Build payload in EXACT order as the working example
    const payload: any = {
      prompt,
      instructions: instructions || 'Provide detailed, well-researched answers.',
    };

    // Add tools if provided (must come before model)
    if (options?.tools && options.tools.length > 0) {
      payload.tools = options.tools;
    }

    // Add parameters in exact order
    payload.top_p = options?.topP ?? 1.0;
    payload.temperature = options?.temperature ?? 0.5;
    payload.max_tokens = options?.maxTokens || 8096;
    payload.stream = options?.stream ?? false;
    payload.model = options?.model || 'mistral-large-latest';
    
    // Add conversation name if provided
    if (options?.conversationName) {
      payload.conversation_name = options.conversationName;
    }
    
    payload.reset_conversation = options?.resetConversation ?? false;
    payload.conversation_history = formattedHistory;

    // Add cookie if available (MUST be last)
    if (mistralCookie) {
      payload.cookie = mistralCookie;
    }

    try {
      console.log('Mistral API Request:', {
        endpoint: mistralEndpoint,
        model: payload.model,
        historyLength: formattedHistory.length,
        hasTools: !!payload.tools,
        hasCookie: !!mistralCookie,
      });

      const response = await lastValueFrom(
        this.httpService.post(mistralEndpoint, payload),
      );

      const data = response.data;

      console.log('Mistral API Response received:', {
        hasContent: !!data.content,
        hasResponse: !!data.response,
        hasError: !!data.error,
      });

      // Check for errors
      if (data.error) {
        throw new InternalServerErrorException(
          `Mistral Service returned error: ${data.error}`,
        );
      }

      // Return the response content
      if (data.content || data.response) {
        return data.content || data.response;
      }

      throw new InternalServerErrorException(
        'Mistral Service returned unexpected response format',
      );
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      
      // Log detailed error information
      console.error('Mistral Service call failed:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error.response?.data,
        status: error.response?.status,
      });
      
      throw new InternalServerErrorException(
        `Mistral Service call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
