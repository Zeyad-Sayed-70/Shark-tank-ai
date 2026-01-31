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

    const payload = {
      prompt,
      youtube_url: youtubeUrl,
      stream: false,
      model: 'gemini-3-flash-preview',
      thinkingMode: true,
      mediaResolution: 'HIGH',
      structuredOutputs: {
        enabled: requestJson,
        schema: jsonSchema || undefined,
      },
      codeExecution: false,
      googleSearch: false,
      urlContext: !!youtubeUrl,
      temperature: 0.7,
      responseWithJson: true,
    };

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
}
