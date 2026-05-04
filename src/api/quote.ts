import request from '@/utils/request';
import type { ApiResponse, MotivationalQuoteVO } from '@/types/api';

/**
 * 获取一条随机励志短句（公开接口，无需登录）
 * GET /api/quotes/random
 */
export function getRandomQuote() {
  return request.get<
    ApiResponse<MotivationalQuoteVO>,
    ApiResponse<MotivationalQuoteVO>
  >('/api/quotes/random');
}

/**
 * 获取「今日一句」（公开接口）
 * GET /api/quotes/today
 */
export function getTodayQuote() {
  return request.get<
    ApiResponse<MotivationalQuoteVO>,
    ApiResponse<MotivationalQuoteVO>
  >('/api/quotes/today');
}
