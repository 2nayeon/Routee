// 카테고리(식당/카페/관광지/쇼핑/숙박 등)에 대한 이모지 · 색상 스타일을 한 곳에서 관리합니다.
// TripDetailPage / ExplorePage / RecommendPage / MyPage 에 흩어져 있던 동일 로직을 통합했습니다.

export interface CatStyle { bg: string; color: string }

const EMOJI_MAP: Record<string, string> = {
  '식당': '🍽️',
  '카페': '☕',
  '관광지': '🏛️',
  '쇼핑': '🛍️',
  '숙박': '🏨',
  'airport': '✈️',
  'establishment': '📍',
}

/** 카테고리 문자열에 맞는 이모지를 반환합니다. 일치하는 게 없으면 기본 📍 를 반환합니다. */
export function categoryEmoji(category?: string | null): string {
  if (!category) return '📍'
  const found = Object.entries(EMOJI_MAP).find(([key]) => category.includes(key))
  return found?.[1] ?? '📍'
}

// 인디고 계열 팔레트 (TripDetailPage / ExplorePage / RecommendPage 에서 사용)
export function indigoCatColors(indigo: string, indigoLight: string): Record<string, CatStyle> {
  return {
    '식당':   { bg: '#FFF0EC', color: '#D4603A' },
    '카페':   { bg: '#FFF4E0', color: '#C47A00' },
    '관광지': { bg: indigoLight, color: indigo },
    '쇼핑':   { bg: '#F3F0FF', color: '#6B4ECC' },
    '숙박':   { bg: '#F0FDF4', color: '#16A34A' },
  }
}

// 스카이블루 계열 팔레트 (MyPage 에서 사용)
export function skyCatColors(blue: string): Record<string, CatStyle> {
  return {
    '식당':   { bg: '#FFF0EC', color: '#D4603A' },
    '카페':   { bg: '#FFF4E0', color: '#C47A00' },
    '관광지': { bg: '#EEF7FF', color: blue },
    '쇼핑':   { bg: '#F3F0FF', color: '#6B4ECC' },
  }
}

/** catColors(팔레트)와 기본 색상(fallback)을 받아 특정 카테고리의 스타일을 반환합니다. */
export function catStyle(
  category: string,
  catColors: Record<string, CatStyle>,
  fallback: CatStyle,
): CatStyle {
  return catColors[category] ?? fallback
}
