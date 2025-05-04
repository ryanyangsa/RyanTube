interface Strings {
  common: {
    error: string;
    close: string;
    retry: string;
    appName: string;
    copyright: string;
    loading: string;
    noResults: string;
  };
  search: {
    placeholder: string;
    button: string;
    error: string;
    quotaExceeded: string;
    noResults: string;
  };
  summary: {
    title: string;
    generating: string;
    summary: string;
    keyPoints: string;
    tags: string;
    watchOnYoutube: string;
    tryAgain: string;
    error: string;
    noContent: string;
  };
  services: {
    youtube: {
      quotaExceeded: string;
      captionsError: string;
      captionContentError: string;
      searchError: string;
      apiError: string;
    };
    openai: {
      error: string;
    };
  };
  layout: {
    title: string;
    description: string;
  };
}

export const ko: Strings = {
  common: {
    error: '오류가 발생했습니다',
    close: '닫기',
    retry: '다시 시도',
    appName: '라이언튜브 RyanTube 👀',
    copyright: '© 2025 RyanTube. All rights reserved.',
    loading: '로딩 중...',
    noResults: '결과가 없습니다',
  },
  search: {
    placeholder: 'YouTube 영상 검색...',
    button: '검색',
    error: '검색 중 오류가 발생했습니다',
    quotaExceeded: 'API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
    noResults: '검색 결과가 없습니다',
  },
  summary: {
    title: '영상 요약',
    generating: '요약 생성 중...',
    summary: '요약',
    keyPoints: '주요 내용',
    tags: '태그',
    watchOnYoutube: 'YouTube에서 보기',
    tryAgain: '다시 시도',
    error: '요약을 생성하지 못했습니다',
    noContent: '요약할 내용이 없습니다',
  },
  services: {
    youtube: {
      quotaExceeded: 'YouTube API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      captionsError: '자막을 가져오는 중 오류가 발생했습니다',
      captionContentError: '자막 내용을 가져오는 중 오류가 발생했습니다',
      searchError: '검색 중 오류가 발생했습니다',
      apiError: 'YouTube API 오류가 발생했습니다',
    },
    openai: {
      error: 'OpenAI API 오류가 발생했습니다',
    },
  },
  layout: {
    title: '라이언튜브 RyanTube 👀',
    description: 'AI로 YouTube 영상을 요약해주는 서비스',
  },
};

// 기본 언어를 한국어로 설정
export const strings = ko;