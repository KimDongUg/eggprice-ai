import logging
from datetime import date
from email.mime.text import MIMEText

import aiosmtplib
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.services.price_service import get_current_prices
from app.services.prediction_service import get_predictions

logger = logging.getLogger(__name__)

router = APIRouter(tags=["email"])

GRADES = ["왕란", "특란", "대란", "중란", "소란"]


class SendReportRequest(BaseModel):
    email: EmailStr


@router.post("/email/send-report")
@limiter.limit(settings.RATE_LIMIT_API)
async def send_report(
    request: Request,
    body: SendReportRequest,
    db: Session = Depends(get_db),
):
    """대시보드 예측 결과를 이메일로 전송"""
    smtp_configured = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)

    # --- Gather data ---
    prices = get_current_prices(db)
    forecasts = {}
    for grade in GRADES:
        preds = get_predictions(db, grade)
        if preds:
            forecasts[grade] = preds

    # --- Build HTML email ---
    today = date.today().isoformat()
    subject = f"[EggPrice AI] 계란 가격 예측 리포트 — {today}"

    # Price rows
    price_rows = ""
    for p in prices:
        change_text = ""
        if p.get("daily_change") is not None:
            sign = "+" if p["daily_change"] > 0 else ""
            color = "#e74c3c" if p["daily_change"] > 0 else "#27ae60" if p["daily_change"] < 0 else "#888"
            change_text = f'<span style="color:{color}">{sign}{p["daily_change"]:,.0f}원 ({sign}{p["daily_change_pct"]:.1f}%)</span>'
        wholesale = f'{p["wholesale_price"]:,.0f}원' if p.get("wholesale_price") else "—"
        price_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">{p["grade"]}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">{wholesale}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">{change_text or '—'}</td>
        </tr>"""

    # Forecast rows
    forecast_rows = ""
    for grade, preds in forecasts.items():
        for p in preds:
            forecast_rows += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">{grade}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">{p.target_date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">{p.predicted_price:,.0f}원</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">{p.confidence_lower:,.0f} ~ {p.confidence_upper:,.0f}원</td>
        </tr>"""

    html = f"""\
<html>
<body style="font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#333;max-width:640px;margin:0 auto">
  <div style="background:#1a56db;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="margin:0;font-size:20px">🥚 EggPrice AI 리포트</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:.85">{today} 기준</p>
  </div>

  <div style="padding:20px 24px;background:#fff;border:1px solid #e5e7eb;border-top:none">
    <h2 style="font-size:16px;margin:0 0 12px;color:#1a56db">📊 오늘의 계란 시세</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">등급</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">도매가 (30개)</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">전일 대비</th>
        </tr>
      </thead>
      <tbody>{price_rows}
      </tbody>
    </table>

    <h2 style="font-size:16px;margin:24px 0 12px;color:#1a56db">🤖 AI 예측 결과</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">등급</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">예측일</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">예측 가격</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb">신뢰 구간</th>
        </tr>
      </thead>
      <tbody>{forecast_rows}
      </tbody>
    </table>
  </div>

  <div style="padding:16px 24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;font-size:12px;color:#6b7280;text-align:center">
    본 리포트는 EggPrice AI에서 자동 생성되었습니다.<br>
    예측 결과는 참고용이며 실제 시장 가격과 다를 수 있습니다.
  </div>
</body>
</html>"""

    if not smtp_configured:
        # SMTP 미설정 (로컬 개발) — 전송 건너뛰고 성공 반환
        logger.info(f"[DEV] Email report generated for {body.email} (SMTP not configured, skipping send)")
        return {"message": "리포트가 생성되었습니다. (SMTP 미설정으로 실제 전송은 생략)", "email": body.email}

    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = body.email

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
    except Exception as e:
        logger.error(f"Failed to send report email to {body.email}: {e}")
        raise HTTPException(status_code=502, detail="이메일 전송에 실패했습니다.")

    return {"message": "리포트가 전송되었습니다.", "email": body.email}
