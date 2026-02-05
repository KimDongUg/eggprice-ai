import logging
from email.mime.text import MIMEText

import aiosmtplib
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.alert import Alert
from app.schemas.alert import AlertCreate

logger = logging.getLogger(__name__)


def create_alert(db: Session, alert_data: AlertCreate) -> Alert:
    alert = Alert(
        email=alert_data.email,
        phone=alert_data.phone,
        grade=alert_data.grade,
        condition=alert_data.condition,
        threshold_price=alert_data.threshold_price,
        notify_email=alert_data.notify_email,
        notify_sms=alert_data.notify_sms,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts_by_email(db: Session, email: str) -> list[Alert]:
    return db.query(Alert).filter(Alert.email == email, Alert.is_active.is_(True)).all()


def delete_alert(db: Session, alert_id: int) -> bool:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return False
    db.delete(alert)
    db.commit()
    return True


def get_active_alerts(db: Session) -> list[Alert]:
    return db.query(Alert).filter(Alert.is_active.is_(True)).all()


async def send_alert_email(email: str, grade: str, predicted_price: float, condition: str, threshold: float):
    """Send an alert notification email."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email send")
        return

    direction = "이상" if condition == "above" else "이하"
    subject = f"[계란가격 알림] {grade} 가격 {direction} 알림"
    body = (
        f"안녕하세요,\n\n"
        f"설정하신 계란 가격 알림 조건이 충족되었습니다.\n\n"
        f"등급: {grade}\n"
        f"예측 가격: {predicted_price:,.0f}원\n"
        f"알림 조건: {threshold:,.0f}원 {direction}\n\n"
        f"자세한 내용은 EggPrice AI 대시보드에서 확인하세요.\n\n"
        f"감사합니다.\n"
        f"EggPrice AI 팀"
    )

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = email

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Alert email sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send alert email to {email}: {e}")


async def send_alert_sms(phone: str, grade: str, predicted_price: float, condition: str, threshold: float):
    """Send an alert notification via SMS. (placeholder – integrate SMS provider here)"""
    direction = "이상" if condition == "above" else "이하"
    message = f"[계란가격 알림] {grade} 예측가 {predicted_price:,.0f}원 ({threshold:,.0f}원 {direction} 도달)"
    logger.info(f"SMS placeholder → {phone}: {message}")


async def check_and_send_alerts(db: Session, predictions: list[dict]):
    """Check active alerts against new predictions and send notifications."""
    alerts = get_active_alerts(db)
    for alert in alerts:
        for pred in predictions:
            if pred["grade"] != alert.grade:
                continue
            price = pred["predicted_price"]
            triggered = (
                (alert.condition == "above" and price >= alert.threshold_price)
                or (alert.condition == "below" and price <= alert.threshold_price)
            )
            if not triggered:
                continue
            if alert.notify_email:
                await send_alert_email(
                    alert.email, alert.grade, price, alert.condition, alert.threshold_price
                )
            if alert.notify_sms and alert.phone:
                await send_alert_sms(
                    alert.phone, alert.grade, price, alert.condition, alert.threshold_price
                )
