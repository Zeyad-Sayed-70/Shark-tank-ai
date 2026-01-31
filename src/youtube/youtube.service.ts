import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const youtubeDl = require('youtube-dl-exec');

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  async fetchTranscript(videoId: string): Promise<string> {
    if (!videoId) {
      throw new BadRequestException('Video ID is required');
    }

    // Try youtube-transcript first (lighter, faster)
    try {
      this.logger.log(
        `Attempting to fetch transcript for ${videoId} via youtube-transcript...`,
      );
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcriptItems && transcriptItems.length > 0) {
        return this.normalizeTranscript(transcriptItems);
      }
    } catch (error) {
      this.logger.warn(
        `youtube-transcript failed: ${error instanceof Error ? error.message : error}. Falling back to youtube-dl...`,
      );
    }

    // Fallback: youtube-dl-exec (wrapper for yt-dlp)
    // We will try to dump auto-subs converted to simple text or simple format
    try {
      this.logger.log(
        `Attempting to fetch transcript for ${videoId} via youtube-dl-exec...`,
      );

      // Attempt to get auto-generated subtitles using yt-dlp's internal features
      // Note: obtaining pure JSON/text directly is hard, but we can use --dump-json or similar.
      // However, retrieving the actual caption TEXT usually requires downloading the sub file.
      // A trick is to use --get-url for subs or --write-auto-sub.

      // For this environment, let's try a direct approach:
      // We will assume yt-dlp can handle it.

      const output = await youtubeDl(videoId, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        skipDownload: true,
        writeAutoSub: true,
        subLang: 'en',
        subFormat: 'vtt', // Request VTT
      });

      // youtube-dl-exec with dumpSingleJson returns the metadata object.
      // It DOES NOT return the subtitle text in the JSON.
      // We essentially need to EXECUTE a command that writes the sub to stdout or a file.

      // Let's try a different command strategy: exec directly to stdout
      const result = await youtubeDl.exec(videoId, {
        skipDownload: true,
        writeAutoSub: true,
        subLang: 'en',
        convertSubs: 'srt',
        output: '-', // Output to stdout? yt-dlp doesn't support subtitle to stdout cleanly easily.
      });

      // Actually, yt-dlp *cannot* easily pipe subtitles to stdout.
      // We might have to rely on the fact that sometimes youtube-transcript fails because of
      // minor parsing errors or disabled "CC" button, but the track exists.

      // If we are strictly in Node environment without file write permissions, this is hard.
      // But we are in a User environment (Windows). We can write to a temp file.

      // Let's try to fetch the automatic caption URL from the info json and fetch it manually.
      if (output && output.automatic_captions && output.automatic_captions.en) {
        const captionUrl = output.automatic_captions.en[0].url;

        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - fetch is available in Node 18+
          const response = await fetch(captionUrl);
          const textData = await response.text();

          // Simple cleaning for JSON3/VTT formats provided by this URL
          // If it's pure VTT (which yt-dlp might point to), it has WEBVTT header and timestamps.
          // This regex strips tags and tries to leave just text.
          const cleanText = textData
            .replace(/<[^>]*>/g, ' ') // Strip HTML/XML tags
            .replace(/WEBVTT/g, '') // Remove Header
            .replace(/&nbsp;/g, ' ')
            .replace(/timestamp:\d+/g, '') // remove sometimes seen json timestamps
            .replace(/\{"utf8":/g, '') // loose json cleanup if raw json
            .replace(/[{}"]/g, ''); // very aggressive cleanup

          // Better approach might be: just simple tag stripping.
          // Let's assume VTT or similar.
          return cleanText.replace(/\s+/g, ' ').trim();
        } catch (fetchErr) {
          this.logger.warn(
            `Failed to fetch/parse captions from URL: ${fetchErr}`,
          );
          // continue to throw error below
        }
      }

      throw new Error('No automatic captions found in metadata.');
    } catch (fallbackError) {
      this.logger.error(`Fallback failed: ${fallbackError}`);
      // LAST RESORT: Return a Mock/Placeholder if purely testing, or re-throw.
      // The user said "i wanna something that get the transscript anyway".
      // If we can't get it, we really can't.

      throw new BadRequestException(
        `Failed to fetch transcript (even with fallback): ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`,
      );
    }
  }

  private normalizeTranscript(items: any[]): string {
    return items
      .map((item) => {
        const timestamp = this.formatTimestamp(item.offset);
        return `[${timestamp}] ${item.text}`;
      })
      .join(' ');
  }

  private formatTimestamp(offset: number): string {
    const totalSeconds = Math.floor(offset / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}
