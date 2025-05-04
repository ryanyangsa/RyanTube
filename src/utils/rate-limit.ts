import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

/**
 * Rate limiting 구현
 * LRU 캐시를 사용하여 요청 횟수를 추적합니다.
 */
export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (request: NextRequest, limit: number) => {
      // IP 대신 요청의 고유 식별자 사용
      const token = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'anonymous';
      
      const tokenCount = (tokenCache.get(token) as number[]) || [0];
      
      if (tokenCount[0] === 0) {
        tokenCache.set(token, [1]);
        return Promise.resolve();
      }

      tokenCount[0] += 1;
      tokenCache.set(token, tokenCount);

      if (tokenCount[0] > limit) {
        return Promise.reject(new Error('Rate limit exceeded'));
      }

      return Promise.resolve();
    },
  };
}
