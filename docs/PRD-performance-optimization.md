# PRD: 로딩 속도 최적화

> **프로젝트:** EggPriceAI
> **작성일:** 2026-01-31
> **스택:** FastAPI + SQLAlchemy · Next.js 14 + React Query · PostgreSQL/TimescaleDB

---

## 현재 문제

| 구분 | 현황 | 영향 |
|------|------|------|
| 백엔드 캐싱 | 일부 엔드포인트만 Redis 캐싱 (market/snapshot, models/* 미적용) | 불필요한 DB 쿼리 반복 |
| 응답 압축 | GZipMiddleware 미적용 | JSON 페이로드 그대로 전송 |
| DB 쿼리 | N+1 패턴 (현재가격 5회, 시장스냅샷 10회 쿼리) | 응답 지연 |
| 프론트엔드 | 모든 페이지 CSR, 코드 스플리팅 없음, Recharts 풀 번들 | 초기 로딩 느림 |
| 페이로드 | 가격 히스토리 180일치 전체 전송 | 대용량 응답 |

---

## Phase 1: 백엔드 캐싱 완성 & 응답 압축

### 목표
모든 읽기 전용 API에 캐싱을 적용하고, GZip 압축으로 전송량을 줄인다.

### 변경 사항

#### 1-1. GZip 압축 미들웨어 추가
- **파일:** `backend/app/main.py`
- **내용:** `from starlette.middleware.gzip import GZipMiddleware` 추가, `app.add_middleware(GZipMiddleware, minimum_size=500)`
- **효과:** JSON 응답 60-80% 크기 감소

#### 1-2. 미캐싱 엔드포인트에 캐시 적용
- **파일:** `backend/app/api/market_data.py`
  - `GET /market/snapshot` — `cache_key="market:snapshot:{target_date}"`, TTL 300초
  - `GET /models/current` — `cache_key="models:current:{grade}"`, TTL 600초
  - `GET /models/performance` — `cache_key="models:perf:{grade}"`, TTL 1800초
- **파일:** `backend/app/api/predictions.py`
  - `GET /predictions/{grade}` — `cache_key="predictions:{grade}"`, TTL 300초

#### 1-3. 캐시 워밍 (서버 시작 시 미리 로드)
- **파일:** `backend/app/core/cache.py` — `warm_cache(db)` 함수 추가
- **파일:** `backend/app/main.py` — lifespan 이벤트에서 `warm_cache()` 호출
- **대상:** `/prices/current`, `/market/snapshot`, `/predictions/forecast?grade=대란`
- **효과:** 첫 번째 요청부터 캐시 히트

### 검증
- `curl -H "Accept-Encoding: gzip" -sD - localhost:8000/api/v1/prices/current` → `Content-Encoding: gzip` 헤더 확인
- 서버 재시작 후 첫 요청 응답 시간 < 50ms (캐시 워밍 확인)

---

## Phase 2: 데이터베이스 쿼리 최적화

### 목표
N+1 쿼리 패턴을 제거하고, 복합 쿼리를 단일 쿼리로 통합한다.

### 변경 사항

#### 2-1. 현재 가격 조회 N+1 제거
- **파일:** `backend/app/services/price_service.py` — `get_current_prices()`
- **현재:** 5개 등급별 개별 쿼리 (5회 DB 호출)
- **개선:** 윈도우 함수 사용, 단일 쿼리로 전 등급 최신 2일치 조회
```sql
SELECT *, ROW_NUMBER() OVER (PARTITION BY grade ORDER BY date DESC) AS rn
FROM egg_prices WHERE rn <= 2
```

#### 2-2. 시장 스냅샷 쿼리 통합
- **파일:** `backend/app/api/market_data.py` — `market_snapshot()`
- **현재:** 10회 개별 쿼리 (가격 5 + 거래량 1 + 사료 1 + 환율 1 + AI 1 + 날씨 1)
- **개선:** 가격 조회를 단일 쿼리로 통합, 나머지 5개 쿼리를 `asyncio.gather`로 병렬 실행
- **효과:** 10회 → 2회 (가격 1회 + 시장데이터 병렬 1회)

#### 2-3. 예측 조회 서브쿼리 통합
- **파일:** `backend/app/services/prediction_service.py` — `get_predictions()`
- **현재:** 2회 쿼리 (최신 base_date 조회 → 해당 날짜 예측 조회)
- **개선:** 서브쿼리로 단일 쿼리 통합

#### 2-4. 인덱스 추가
- **파일:** `backend/app/models/price.py` — 복합 인덱스 추가
```python
__table_args__ = (
    Index("ix_eggprice_grade_date", "grade", "date"),
)
```
- **파일:** `backend/app/models/prediction.py`
```python
__table_args__ = (
    Index("ix_prediction_grade_basedate", "grade", "base_date"),
)
```

### 검증
- 로그에서 쿼리 횟수 확인: `/prices/current` 1회, `/market/snapshot` 2회
- `EXPLAIN ANALYZE` 로 인덱스 사용 확인

---

## Phase 3: 프론트엔드 점진적 로딩 & 코드 스플리팅

### 목표
사용자가 즉시 UI를 보고, 데이터가 섹션별로 점진적으로 로드되도록 한다.

### 변경 사항

#### 3-1. Recharts 동적 임포트
- **파일:** `frontend/src/components/dashboard/PriceTrendChart.tsx`
- **내용:** `next/dynamic`으로 Recharts 컴포넌트 lazy load
```tsx
const PriceTrendChart = dynamic(
  () => import("@/components/dashboard/PriceTrendChart"),
  { loading: () => <ChartSkeleton />, ssr: false }
);
```
- **효과:** 초기 번들에서 Recharts (~200KB) 제거

#### 3-2. 섹션별 Skeleton UI 적용
- **파일:** `frontend/src/components/ui/Skeleton.tsx` — NEW: 재사용 가능한 Skeleton 컴포넌트
- **파일:** `frontend/src/app/page.tsx` — 각 섹션에 개별 로딩 상태 적용
- **현재:** 전체 화면 오버레이 (`LoadingOverlay`)
- **개선:** 섹션별 독립 로딩
  - 가격 카드: 즉시 Skeleton 5개 → 데이터 도착 시 교체
  - AI 예측: Skeleton → 데이터 도착 시 교체
  - 차트: `ssr: false` + Skeleton → Recharts 로드 후 교체
  - 시장요인/모델성능: 하단이므로 마지막 로드

#### 3-3. 뷰포트 밖 컴포넌트 Lazy Load
- **파일:** `frontend/src/app/page.tsx`
- **내용:** `QuickAlertSetup`, `MarketFactorsCard`, `ModelPerformanceCard`를 `dynamic()`으로 lazy load
- **효과:** 초기 렌더링에 필요 없는 컴포넌트 지연 로드

#### 3-4. React Query 프리페칭
- **파일:** `frontend/src/app/layout.tsx` 또는 `providers.tsx`
- **내용:** `queryClient.prefetchQuery`로 핵심 데이터 미리 요청
```tsx
// 레이아웃 로드 시 핵심 데이터 프리페치
queryClient.prefetchQuery({ queryKey: ["prices", "current"], queryFn: ... });
```

### 검증
- Lighthouse Performance 점수 측정 (before/after)
- 네트워크 탭에서 Recharts 청크가 별도 로드되는지 확인
- 각 섹션이 독립적으로 로딩되는지 시각적 확인

---

## Phase 4: API 페이로드 최적화

### 목표
전송되는 데이터 크기를 줄여 네트워크 지연을 최소화한다.

### 변경 사항

#### 4-1. 가격 히스토리 페이지네이션
- **파일:** `backend/app/api/prices.py` — `price_history()` 엔드포인트 수정
- **현재:** 180일치 전체 전송 (약 180 × ~100B = ~18KB)
- **개선:** 기본값 90일, `page`/`page_size` 파라미터 추가
```python
@router.get("/prices/history")
async def price_history(
    grade: str = "대란",
    days: int = 90,        # 180 → 90 기본값
    page: int = 1,
    page_size: int = 90,
):
```

#### 4-2. 응답 필드 최소화
- **파일:** `backend/app/schemas/price.py` — 히스토리 응답용 경량 스키마 추가
```python
class PriceHistoryLight(BaseModel):
    d: str    # date (ISO 축약)
    r: int    # retail_price
    w: int    # wholesale_price
```
- **파일:** `backend/app/api/prices.py` — `?compact=true` 쿼리 파라미터 지원

#### 4-3. 시장 스냅샷 응답 최적화
- **파일:** `backend/app/api/market_data.py`
- **내용:** 불필요한 중첩 제거, null 필드 생략 (`response_model_exclude_none=True`)

#### 4-4. ETag/Last-Modified 헤더
- **파일:** `backend/app/core/cache.py` — `ETag` 생성 유틸 추가
- **파일:** `backend/app/api/prices.py` — `If-None-Match` 헤더 처리, 304 응답
- **효과:** 데이터 미변경 시 빈 응답으로 대역폭 절약

### 검증
- `curl` 로 응답 크기 비교: `wc -c` (compact vs full)
- `If-None-Match` 헤더 전송 시 304 응답 확인
- 프론트엔드 네트워크 탭에서 전송량 감소 확인

---

## Phase 5: SSR/ISR & 번들 최적화

### 목표
핵심 페이지를 서버에서 렌더링하여 초기 로딩 속도를 개선하고, 번들 크기를 최적화한다.

### 변경 사항

#### 5-1. 대시보드 SSR 전환
- **파일:** `frontend/src/app/page.tsx`
- **내용:** `"use client"` 제거, 서버 컴포넌트로 전환
```tsx
// page.tsx (Server Component)
export const revalidate = 180; // ISR: 3분마다 재검증

async function fetchPrices() {
  const res = await fetch(`${API_URL}/prices/current`, { next: { revalidate: 180 } });
  return res.json();
}

export default async function DashboardPage() {
  const prices = await fetchPrices();
  return (
    <DashboardContent initialPrices={prices} />
  );
}
```
- **파일:** `frontend/src/components/dashboard/DashboardContent.tsx` — NEW: 클라이언트 컴포넌트 (React Query hydration)
- **효과:** 초기 HTML에 가격 데이터 포함 → 빈 화면 없이 즉시 표시

#### 5-2. Next.js 번들 최적화
- **파일:** `frontend/next.config.js`
```js
const nextConfig = {
  output: "standalone",
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: ["recharts", "@sentry/nextjs"],
  },
  // ...
};
```

#### 5-3. 번들 분석 도구 추가
- **파일:** `frontend/package.json` — `@next/bundle-analyzer` 추가
- **파일:** `frontend/next.config.js` — 분석 모드 설정
```js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
```
- **사용:** `ANALYZE=true npm run build`

#### 5-4. 정적 페이지 SSG 적용
- **파일:** `frontend/src/app/privacy/page.tsx` — 이미 정적 (변경 불필요)
- **파일:** `frontend/src/app/terms/page.tsx` — 이미 정적 (변경 불필요)
- **확인:** 빌드 시 정적 생성 확인 (`○` 마크)

### 검증
- `npm run build` 출력에서 `/` 페이지가 SSR/ISR로 표시되는지 확인
- `ANALYZE=true npm run build` → 번들 리포트에서 Recharts가 별도 청크인지 확인
- `curl localhost:3000` → HTML 소스에 가격 데이터가 포함되어 있는지 확인

---

## Phase 6: 프로덕션 캐싱 인프라 & CDN

### 목표
프로덕션 환경에서 Redis 캐싱, 정적 자산 CDN, 엣지 캐싱을 구성한다.

### 변경 사항

#### 6-1. Redis 캐시 전략 고도화
- **파일:** `backend/app/core/cache.py` — 캐시 계층화
```python
# L1: 인메모리 캐시 (LRU, 100개, TTL 60초) — 초고속
# L2: Redis 캐시 (TTL 300초) — 분산
# DB: 최종 소스
```
- **파일:** `backend/app/core/config.py` — 캐시 TTL 설정 추가
```python
CACHE_TTL_L1: int = 60
CACHE_TTL_PRICES: int = 180
CACHE_TTL_MARKET: int = 300
CACHE_TTL_MODEL: int = 1800
```

#### 6-2. Redis 연결 풀 최적화
- **파일:** `backend/app/core/cache.py`
```python
pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=20,
    socket_connect_timeout=2,
    socket_timeout=3,
    retry_on_timeout=True,
)
```

#### 6-3. 정적 자산 캐시 헤더
- **파일:** `frontend/next.config.js` — 정적 자산에 장기 캐시 헤더 추가
```js
async headers() {
  return [
    {
      source: "/_next/static/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // ...
  ];
}
```

#### 6-4. Docker Compose 캐시 설정
- **파일:** `docker-compose.yml` — Redis 메모리 정책 설정
```yaml
redis:
  command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
```

#### 6-5. 성능 모니터링 대시보드
- **파일:** `monitoring/grafana/dashboards/eggprice-overview.json` — 패널 추가
  - Cache Hit Rate (Redis)
  - API Response Time p50/p95/p99
  - Frontend TTFB (Time to First Byte)

### 검증
- Redis CLI: `INFO stats` → `keyspace_hits`, `keyspace_misses` 확인
- Grafana 대시보드에서 캐시 히트율 > 80% 확인
- `curl -sD - localhost:3000/_next/static/...` → `Cache-Control: immutable` 확인
- 전체 페이지 로드 시간 측정: 목표 < 2초 (3G), < 1초 (4G)

---

## 실행 순서 및 의존성

```
Phase 1 (캐싱 & 압축)
  ↓
Phase 2 (DB 쿼리 최적화)    ← Phase 1과 병렬 가능
  ↓
Phase 3 (프론트엔드 점진적 로딩)
  ↓
Phase 4 (페이로드 최적화)    ← Phase 3과 병렬 가능
  ↓
Phase 5 (SSR/ISR & 번들)
  ↓
Phase 6 (프로덕션 인프라)
```

## 예상 효과

| 지표 | 현재 (추정) | Phase 3 완료 후 | Phase 6 완료 후 |
|------|-------------|-----------------|-----------------|
| 초기 로딩 (FCP) | 3-5초 | 1-2초 | < 1초 |
| API 응답 (캐시 미스) | 200-500ms | 50-150ms | 50-150ms |
| API 응답 (캐시 히트) | 200-500ms | < 10ms | < 5ms |
| 전송량 (대시보드) | ~50KB | ~30KB | ~20KB (gzip) |
| Lighthouse 점수 | 60-70 | 80-85 | 90+ |

## 수정 파일 총괄

| Phase | 신규 | 수정 | 합계 |
|-------|------|------|------|
| 1 | 0 | 4 | 4 |
| 2 | 0 | 5 | 5 |
| 3 | 2 | 3 | 5 |
| 4 | 1 | 3 | 4 |
| 5 | 2 | 3 | 5 |
| 6 | 0 | 4 | 4 |
| **합계** | **5** | **22** | **27** |
