declare module 'youtube-caption-extractor' {
  interface SubtitleItem {
    start: number;
    duration: number;
    text: string;
  }

  interface SubtitleOptions {
    videoID: string;
    lang?: string;
  }

  export function getSubtitles(options: SubtitleOptions): Promise<SubtitleItem[]>;
}
