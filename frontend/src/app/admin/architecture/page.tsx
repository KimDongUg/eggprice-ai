"use client";

export default function ArchitecturePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">시스템 아키텍처</h1>
        <p className="text-sm text-gray-500 mt-1">슬기알 전체 시스템 구성도</p>
      </div>

      <div
        className="bg-[#0a0e1a] rounded-xl overflow-hidden border border-gray-200 shadow-lg"
        style={{ minHeight: 700 }}
      >
        <style>{`
          .arch-root {
            --bg: #0a0e1a;
            --surface: #111827;
            --surface2: #1a2236;
            --border: #1e2d45;
            --accent: #f59e0b;
            --accent2: #3b82f6;
            --accent3: #10b981;
            --accent4: #8b5cf6;
            --text: #e2e8f0;
            --muted: #64748b;
            --line: #2a3f5f;
            color: var(--text);
            font-family: 'Noto Sans KR', sans-serif;
            padding: 40px 32px;
            background-image:
              radial-gradient(ellipse at 20% 10%, rgba(59,130,246,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 90%, rgba(245,158,11,0.06) 0%, transparent 50%);
            position: relative;
          }
          .arch-root::before {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image:
              linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
            background-size: 40px 40px;
          }
          .arch-root * { box-sizing: border-box; }
          .arch-header { text-align: center; margin-bottom: 44px; position: relative; z-index: 1; }
          .arch-badge {
            display: inline-block;
            background: rgba(245,158,11,0.15);
            border: 1px solid rgba(245,158,11,0.3);
            color: var(--accent);
            font-size: 11px;
            font-family: 'JetBrains Mono', monospace;
            letter-spacing: 0.15em;
            padding: 4px 14px;
            border-radius: 20px;
            margin-bottom: 14px;
            text-transform: uppercase;
          }
          .arch-title {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -0.03em;
            background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 6px;
          }
          .arch-subtitle { color: var(--muted); font-size: 13px; font-weight: 300; }
          .arch-content { max-width: 1100px; margin: 0 auto; position: relative; z-index: 1; }
          .arch-row { display: flex; gap: 16px; align-items: stretch; }
          .arch-node {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px 22px;
            flex: 1;
            position: relative;
            transition: border-color 0.2s, box-shadow 0.2s;
            overflow: hidden;
          }
          .arch-node::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            border-radius: 12px 12px 0 0;
          }
          .arch-node:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
          .n-amber::before { background: linear-gradient(90deg, var(--accent), #fbbf24); }
          .n-amber { border-color: rgba(245,158,11,0.25); }
          .n-amber:hover { border-color: rgba(245,158,11,0.5); }
          .n-blue::before { background: linear-gradient(90deg, var(--accent2), #60a5fa); }
          .n-blue { border-color: rgba(59,130,246,0.25); }
          .n-blue:hover { border-color: rgba(59,130,246,0.5); }
          .n-green::before { background: linear-gradient(90deg, var(--accent3), #34d399); }
          .n-green { border-color: rgba(16,185,129,0.25); }
          .n-green:hover { border-color: rgba(16,185,129,0.5); }
          .n-purple::before { background: linear-gradient(90deg, var(--accent4), #a78bfa); }
          .n-purple { border-color: rgba(139,92,246,0.25); }
          .n-purple:hover { border-color: rgba(139,92,246,0.5); }
          .arch-node-icon { font-size: 22px; margin-bottom: 10px; display: block; }
          .arch-node-title { font-size: 13px; font-weight: 700; color: #f1f5f9; margin-bottom: 3px; }
          .arch-node-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-bottom: 12px; letter-spacing: 0.05em; }
          .arch-features { list-style: none; display: flex; flex-direction: column; gap: 5px; padding: 0; margin: 0; }
          .arch-features li { font-size: 11.5px; color: #94a3b8; display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }
          .arch-features li::before { content: '—'; color: var(--muted); flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-size: 10px; margin-top: 2px; }
          .arch-api-label { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; }
          .arch-api-tag {
            background: rgba(59,130,246,0.12);
            border: 1px solid rgba(59,130,246,0.25);
            color: #60a5fa;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            padding: 3px 10px;
            border-radius: 4px;
            letter-spacing: 0.08em;
          }
          .arch-backend {
            background: var(--surface2);
            border: 1px solid rgba(59,130,246,0.3);
            border-radius: 12px;
            padding: 22px 28px;
            text-align: center;
            position: relative;
            overflow: hidden;
            flex: 1;
          }
          .arch-backend::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--accent2), #818cf8, var(--accent2));
            border-radius: 12px 12px 0 0;
          }
          .arch-backend-title { font-size: 15px; font-weight: 700; color: #f1f5f9; margin-bottom: 2px; }
          .arch-backend-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-bottom: 18px; }
          .arch-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
          .arch-pill { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #94a3b8; font-size: 11px; padding: 4px 10px; border-radius: 6px; }
          .arch-branch-connector {
            position: relative;
            height: 44px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0 calc(16.66% + 8px);
          }
          .arch-branch-connector::before {
            content: '';
            position: absolute;
            top: 0;
            left: calc(16.66% + 8px);
            right: calc(16.66% + 8px);
            height: 1px;
            background: var(--line);
          }
          .arch-branch-tick {
            width: 1px;
            height: 44px;
            background: linear-gradient(to bottom, var(--line), transparent);
            position: relative;
          }
          .arch-branch-tick::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 0; height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 6px solid var(--line);
          }
          .arch-branch-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .arch-db-node {
            flex: 1;
            background: var(--surface2);
            border: 1px solid rgba(245,158,11,0.3);
            border-radius: 12px;
            padding: 22px 28px;
            position: relative;
            overflow: hidden;
          }
          .arch-db-node::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--accent), #f97316, #ef4444, var(--accent));
            border-radius: 12px 12px 0 0;
          }
          .arch-db-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
          .arch-db-item {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
            line-height: 1.5;
          }
          .arch-db-item-icon { font-size: 16px; display: block; margin-bottom: 4px; }
          .arch-legend { display: flex; gap: 20px; justify-content: center; margin-top: 32px; flex-wrap: wrap; }
          .arch-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); }
          .arch-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
          @media (max-width: 768px) {
            .arch-row, .arch-branch-row { flex-direction: column; display: flex; }
            .arch-db-grid { grid-template-columns: repeat(2, 1fr); }
            .arch-branch-connector { display: none; }
          }
        `}</style>

        <div className="arch-root">
          <div className="arch-header">
            <div className="arch-badge">System Architecture</div>
            <div className="arch-title">슬기알 전체 아키텍처</div>
            <p className="arch-subtitle">eggprice.kr — 계란 가격 예측 서비스</p>
          </div>

          <div className="arch-content">
            {/* ROW 1: Frontend / Admin */}
            <div className="arch-row">
              <div className="arch-node n-amber">
                <span className="arch-node-icon">🖥️</span>
                <div className="arch-node-title">Vercel 프론트엔드</div>
                <div className="arch-node-sub">eggprice.kr</div>
                <ul className="arch-features">
                  <li>메인 대시보드</li>
                  <li>7일 / 14일 / 30일 예측</li>
                  <li>다음달 상세 예측</li>
                  <li>외부 시장요인 표시</li>
                </ul>
              </div>
              <div className="arch-node n-purple">
                <span className="arch-node-icon">🔐</span>
                <div className="arch-node-title">관리자 페이지</div>
                <div className="arch-node-sub">Vercel (Admin)</div>
                <ul className="arch-features">
                  <li>실제가격 입력 / 검수</li>
                  <li>예측 결과 조회</li>
                  <li>오차율 / 정확도 분석</li>
                  <li>알림 / 배치 상태 확인</li>
                </ul>
              </div>
            </div>

            {/* Arrow */}
            <div className="arch-api-label">
              <span className="arch-api-tag">API CALL</span>
            </div>

            {/* ROW 2: Backend */}
            <div className="arch-row">
              <div className="arch-backend">
                <span style={{ fontSize: 26, display: "block", marginBottom: 10 }}>⚙️</span>
                <div className="arch-backend-title">Render 백엔드 API 서버</div>
                <div className="arch-backend-sub">eggprice-api-docker</div>
                <div className="arch-pills">
                  <span className="arch-pill">가격 수집 API</span>
                  <span className="arch-pill">AI 예측 API</span>
                  <span className="arch-pill">정확도 평가 API</span>
                  <span className="arch-pill">관리자 API</span>
                  <span className="arch-pill">인증 / 보안</span>
                  <span className="arch-pill">로그</span>
                </div>
              </div>
            </div>

            {/* Branch Connector */}
            <div className="arch-branch-connector">
              <div className="arch-branch-tick" />
              <div className="arch-branch-tick" />
              <div className="arch-branch-tick" />
            </div>

            {/* ROW 3: Sub-systems */}
            <div className="arch-branch-row">
              <div className="arch-node n-green">
                <span className="arch-node-icon">⏱️</span>
                <div className="arch-node-title">Render Cron Jobs</div>
                <div className="arch-node-sub">자동 배치 스케줄러</div>
                <ul className="arch-features">
                  <li>06:00 데이터 수집</li>
                  <li>07:00 예측 배치 실행</li>
                  <li>08:00 정확도 평가</li>
                </ul>
              </div>
              <div className="arch-node n-blue">
                <span className="arch-node-icon">🤖</span>
                <div className="arch-node-title">AI 예측 엔진</div>
                <div className="arch-node-sub">ML / 통계 / 규칙 모델</div>
                <ul className="arch-features">
                  <li>단기 / 중기 가격 예측</li>
                  <li>다중 모델 앙상블</li>
                  <li>시계열 분석</li>
                </ul>
              </div>
              <div className="arch-node n-amber">
                <span className="arch-node-icon">🌐</span>
                <div className="arch-node-title">외부 데이터 수집</div>
                <div className="arch-node-sub">KAMIS / 시장지표</div>
                <ul className="arch-features">
                  <li>KAMIS 가격 데이터</li>
                  <li>외부 시장 지표</li>
                  <li>수급 / 환경 데이터</li>
                </ul>
              </div>
            </div>

            {/* Arrow */}
            <div className="arch-api-label">
              <span className="arch-api-tag">READ / WRITE</span>
            </div>

            {/* ROW 4: DB */}
            <div className="arch-row">
              <div className="arch-db-node">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 24 }}>🗄️</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Render PostgreSQL DB</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--muted)" }}>Primary Data Store</div>
                  </div>
                </div>
                <div className="arch-db-grid">
                  <div className="arch-db-item"><span className="arch-db-item-icon">📊</span>원본 가격 데이터</div>
                  <div className="arch-db-item"><span className="arch-db-item-icon">🌍</span>외부 시장요인 데이터</div>
                  <div className="arch-db-item"><span className="arch-db-item-icon">🔮</span>예측 결과</div>
                  <div className="arch-db-item"><span className="arch-db-item-icon">✅</span>실제값 확정 데이터</div>
                  <div className="arch-db-item"><span className="arch-db-item-icon">📈</span>오차율 / 정확도 이력</div>
                  <div className="arch-db-item"><span className="arch-db-item-icon">📝</span>관리자 로그 / 알림 이력</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="arch-legend">
              <div className="arch-legend-item"><div className="arch-legend-dot" style={{ background: "var(--accent)" }} /><span>프론트엔드 / 수집</span></div>
              <div className="arch-legend-item"><div className="arch-legend-dot" style={{ background: "var(--accent2)" }} /><span>API 서버 / AI 엔진</span></div>
              <div className="arch-legend-item"><div className="arch-legend-dot" style={{ background: "var(--accent3)" }} /><span>배치 / 스케줄러</span></div>
              <div className="arch-legend-item"><div className="arch-legend-dot" style={{ background: "var(--accent4)" }} /><span>관리자</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
