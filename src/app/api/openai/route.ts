import { NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const prompt = `다음 영상의 내용을 분석하여 JSON 형식으로만 응답해주세요. 추가 텍스트는 포함하지 마세요.

영상 제목: ${title}
영상 설명: ${description}

응답 JSON 형식:
{
  "summary": "영상의 핵심 내용을 2-3문장으로 요약",
  "keyPoints": ["영상의 주요 내용 3-5개를 간단히 나열"],
  "topicTags": ["관련 주제 태그 3-5개"]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 영상 콘텐츠 분석가입니다. 항상 JSON 형식으로만 응답하고 추가 텍스트는 포함하지 마세요.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse OpenAI response:', responseText);
      throw new Error(`Invalid JSON response from OpenAI API: ${responseText.slice(0, 100)}...`);
    }

    if (!response.ok) {
      console.error('OpenAI API error response:', data);
      throw new Error(data.error?.message || `OpenAI API request failed with status ${response.status}`);
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI API response structure:', data);
      throw new Error('Invalid response structure from OpenAI API');
    }

    let content;
    try {
      const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in the response');
      }
      content = JSON.parse(jsonMatch[0]);
    } catch {
      console.error('Failed to parse content:', data.choices[0].message.content);
      throw new Error('Failed to parse content from OpenAI response');
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process request' },
      { status: 500 }
    );
  }
}
