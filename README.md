# RyanTube - AI 기반 유튜브 영상 요약 서비스

유튜브 영상의 내용을 한눈에 파악하고 싶으신가요? RyanTube는 OpenAI의 GPT 모델을 활용하여 유튜브 영상의 내용을 자동으로 요약해주는 서비스입니다.

## 주요 기능

- 유튜브 영상 검색
- 영상 자막 기반 AI 요약 생성
- 무한 스크롤 지원
- 반응형 디자인
- 다국어 지원 준비 (현재 한국어)

## 기술 스택

### 프론트엔드
- Next.js 14 (React 기반 풀스택 프레임워크)
- React 18
- TypeScript
- TailwindCSS

### 외부 API
- YouTube Data API v3
- OpenAI API (GPT 모델)

### 개발 도구
- npm
- ESLint
- Prettier

## 시작하기

1. 저장소 클론
```bash
git clone https://github.com/yourusername/RyanTube.git
cd RyanTube
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
```
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 확인
```
http://localhost:3000
```

## 주요 기능 설명

### YouTube 영상 검색
- YouTube Data API를 사용하여 영상 검색
- 무한 스크롤로 더 많은 결과 로드
- 검색 결과 그리드 레이아웃

### AI 요약 생성
- 영상의 자막 데이터 추출
- OpenAI GPT 모델을 사용한 내용 요약
- 주요 포인트 및 태그 생성

### 에러 처리
- API 할당량 초과 감지 및 알림
- 자막 없는 영상 처리
- 네트워크 오류 처리

## 프로젝트 구조

```
src/
  ├── app/              # Next.js 앱 라우터
  ├── components/       # React 컴포넌트
  ├── constants/        # 상수 및 문자열
  ├── services/         # API 서비스
  └── utils/           # 유틸리티 함수
```

## 개발 목적

이 프로젝트는 현대인의 시간 절약과 효율적인 정보 소비를 돕기 위해 개발되었습니다. 특히 다음과 같은 문제를 해결하고자 했습니다:

1. 영상 시청 전 내용 파악의 어려움
2. 긴 영상에서 핵심 내용을 빠르게 파악하고 싶은 니즈
3. 관심 있는 주제의 영상을 효율적으로 필터링하고 싶은 요구

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request