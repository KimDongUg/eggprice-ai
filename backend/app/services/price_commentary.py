"""오늘 계란 가격 해설 자동 생성 — 가격 변동폭·추세 기반."""

import random


def generate_price_commentary(
    price: float,
    change: float | None,
    change_pct: float | None,
    avg_7d: float | None,
    avg_30d: float | None,
    grade: str = "특란",
    region: str = "서울",
) -> dict:
    """오늘 가격 데이터를 바탕으로 해설 title/summary/body를 생성합니다."""

    # ── 방향 판별 ──
    if change is None or change == 0:
        direction = "보합"
    elif change > 0:
        direction = "상승"
    else:
        direction = "하락"

    abs_change = abs(change) if change else 0
    abs_pct = abs(change_pct) if change_pct else 0.0

    # ── 변동 강도 ──
    if abs_pct >= 3.0:
        intensity = "급"
    elif abs_pct >= 1.0:
        intensity = ""
    else:
        intensity = "소폭 "

    price_str = f"{int(price):,}원"
    change_str = f"{'+' if change and change > 0 else ''}{int(abs_change):,}원"

    # ── title ──
    title = f"오늘 {region} {grade} 30구 가격 해설"

    # ── summary (한줄 해설) ──
    if direction == "보합":
        summaries = [
            f"오늘 {region} {grade} 30구 도매가는 {price_str}으로 전일과 동일한 수준을 유지하고 있습니다.",
            f"오늘 {grade} 가격은 {price_str}으로 변동 없이 보합세를 보이고 있습니다.",
            f"{region} 기준 {grade} 30구 가격이 {price_str}에서 횡보 중입니다.",
        ]
    elif direction == "상승":
        summaries = [
            f"오늘 {region} {grade} 30구 도매가는 {price_str}으로 전일 대비 {intensity}{change_str} 상승했습니다.",
            f"{grade} 가격이 {price_str}까지 올라 전일보다 {change_str} 높은 수준입니다.",
            f"오늘 {region} 기준 {grade} 30구 가격은 {price_str}으로, 전일 대비 {intensity}오름세를 보이고 있습니다.",
        ]
    else:
        summaries = [
            f"오늘 {region} {grade} 30구 도매가는 {price_str}으로 전일 대비 {intensity}{change_str} 하락했습니다.",
            f"{grade} 가격이 {price_str}으로 내려 전일보다 {change_str} 낮은 수준입니다.",
            f"오늘 {region} 기준 {grade} 30구 가격은 {price_str}으로, 전일 대비 {intensity}내림세입니다.",
        ]
    summary = random.choice(summaries)

    # ── body (800자+ 본문) ──
    body_parts = []

    # 1단락: 오늘 가격 수준
    body_parts.append(
        f"오늘({region} 기준) {grade} 30구 도매가격은 {price_str}입니다. "
        f"전일 대비 {'변동 없는 보합' if direction == '보합' else f'{intensity}{change_str} {direction}'}세를 보이고 있습니다."
    )

    # 2단락: 최근 흐름
    if avg_7d and avg_30d:
        avg_7d_str = f"{int(avg_7d):,}원"
        avg_30d_str = f"{int(avg_30d):,}원"
        diff_7d = price - avg_7d
        diff_30d = price - avg_30d

        if diff_7d > 0:
            trend_7d = f"최근 7일 평균({avg_7d_str})보다 {int(abs(diff_7d)):,}원 높은 수준"
        elif diff_7d < 0:
            trend_7d = f"최근 7일 평균({avg_7d_str})보다 {int(abs(diff_7d)):,}원 낮은 수준"
        else:
            trend_7d = f"최근 7일 평균({avg_7d_str})과 동일한 수준"

        if diff_30d > 0:
            trend_30d = f"30일 평균({avg_30d_str}) 대비로는 {int(abs(diff_30d)):,}원 높습니다"
        elif diff_30d < 0:
            trend_30d = f"30일 평균({avg_30d_str}) 대비로는 {int(abs(diff_30d)):,}원 낮습니다"
        else:
            trend_30d = f"30일 평균({avg_30d_str})과 동일합니다"

        body_parts.append(
            f"최근 가격 흐름을 살펴보면, 현재 가격은 {trend_7d}이며, {trend_30d}. "
            "단기와 중기 추세를 함께 보면 현재 시장의 방향성을 더 정확하게 파악할 수 있습니다."
        )

    # 3단락: 변동 요인 분석
    if direction == "상승":
        factors = [
            "가격 상승의 배경에는 여러 복합 요인이 작용할 수 있습니다. "
            "산란계 사육 마릿수 변동, 사료 원료(옥수수·대두) 가격 상승, 계절적 수요 증가, "
            "또는 조류인플루엔자(AI) 발생에 따른 공급 감소 등이 대표적입니다. "
            "특히 사료비는 계란 생산원가의 60~70%를 차지하기 때문에, 국제 곡물 시세와 원/달러 환율 변동이 "
            "계란 가격에 직접적인 영향을 미칩니다.",

            "최근 가격 상승세는 공급 측면의 변화가 주요 원인으로 분석됩니다. "
            "산란계 입식 후 산란 개시까지 약 5개월의 시차가 있어, 한번 줄어든 공급이 회복되기까지 "
            "시간이 필요합니다. 여기에 사료비 상승, 인건비 증가 등 생산 비용 부담이 가중되면 "
            "가격 상승 압력이 더욱 커지는 구조입니다.",
        ]
    elif direction == "하락":
        factors = [
            "가격 하락은 공급 안정화 또는 소비 둔화가 주요 원인일 수 있습니다. "
            "산란계 사육 마릿수가 정상 수준을 회복하거나, 수입 물량이 시장에 풀리면 "
            "공급이 늘어 가격이 내려갑니다. 또한 명절 이후 수요 감소, 외식 경기 둔화 등도 "
            "소비 측면에서 가격을 끌어내리는 요인입니다.",

            "하락 흐름이 지속되면 양계 농가의 수익성 악화로 이어질 수 있습니다. "
            "생산원가 대비 출하가가 낮아지면 농가들이 산란계를 도태시키거나 입식을 줄이게 되고, "
            "이는 수개월 후 다시 공급 부족 → 가격 반등으로 이어지는 순환 구조를 보입니다.",
        ]
    else:
        factors = [
            "보합세는 현재 수급이 비교적 균형을 이루고 있다는 신호입니다. "
            "산란계 사육 마릿수와 소비량이 안정적으로 유지되고 있으며, "
            "사료비나 환율 등 비용 측면에서도 큰 변동이 없는 상황으로 해석됩니다. "
            "다만 조류인플루엔자 발생, 폭염·한파 등 돌발 변수에 따라 "
            "언제든 가격이 움직일 수 있으므로 지속적인 모니터링이 필요합니다.",

            "가격이 일정 구간에서 횡보하는 것은 시장이 새로운 방향을 모색하는 과도기일 수 있습니다. "
            "수급 균형이 유지되는 동안은 큰 변동이 없지만, 기상 이변이나 방역 상황 변화, "
            "정부 정책 변동 등 외부 충격이 가해지면 빠르게 방향이 전환될 수 있습니다.",
        ]
    body_parts.append(random.choice(factors))

    # 4단락: 소비자 행동 가이드
    if direction == "상승":
        guide = (
            "소비자 입장에서는 가격 상승기에 할인마트 행사 기간을 활용하거나, "
            "대란·중란 등 상대적으로 가격 부담이 적은 등급을 선택하는 것도 방법입니다. "
            "유통업체나 식자재 업체는 단기 재고 확보 전략을 검토해 볼 시점입니다."
        )
    elif direction == "하락":
        guide = (
            "가격 하락기는 소비자에게 유리한 시점입니다. 대량 구매나 재고 확보를 고려할 만합니다. "
            "다만 유통업체는 하락 폭과 지속 기간을 면밀히 살펴 재고 리스크를 관리해야 합니다. "
            "양계 농가 입장에서는 사료비 대비 수익성을 꼼꼼히 따져볼 시점입니다."
        )
    else:
        guide = (
            "보합기에는 급격한 가격 변동 가능성이 낮으므로, 일반 소비자는 평소대로 구매하시면 됩니다. "
            "다만 유통업체나 대량 구매자는 향후 가격 변동 가능성에 대비해 "
            "슬기알 AI 예측을 참고하여 구매 타이밍을 조절하는 것을 권장합니다."
        )
    body_parts.append(guide)

    # 5단락: AI 예측 연동
    body_parts.append(
        "슬기알 AI는 KAMIS 도매가, 사료 가격, 원/달러 환율, 조류인플루엔자 현황, 기온, 수입량 등 "
        "16개 시장 변수를 LSTM 딥러닝 모델로 분석하여 7일·14일·30일 후 가격을 예측합니다. "
        "오늘 가격을 확인하셨다면, AI 예측 페이지에서 앞으로의 가격 방향도 함께 확인해 보세요. "
        "과거 데이터 기반의 통계적 분석이 합리적인 구매·판매 의사결정에 도움을 줄 수 있습니다."
    )

    body = "\n\n".join(body_parts)

    return {"title": title, "summary": summary, "body": body}
