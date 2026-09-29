from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from .config import DATABASE_URL


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        UniqueConstraint("gmail_thread_id", name="uq_interview_thread"),
        Index("ix_interview_status_date", "status", "interview_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    gmail_thread_id: Mapped[str] = mapped_column(String(255), nullable=False)
    gmail_message_id: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    interview_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    interviewer_names: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    meeting_link: Mapped[str | None] = mapped_column(Text)
    subject: Mapped[str] = mapped_column(Text, default="", nullable=False)
    last_email_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    events: Mapped[list[InterviewEvent]] = relationship(back_populates="interview", cascade="all, delete-orphan")


class InterviewEvent(Base):
    __tablename__ = "interview_events"
    __table_args__ = (UniqueConstraint("gmail_message_id", name="uq_event_message"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    interview_id: Mapped[int] = mapped_column(ForeignKey("interviews.id"), nullable=False)
    gmail_message_id: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    subject: Mapped[str] = mapped_column(Text, default="", nullable=False)
    interview: Mapped[Interview] = relationship(back_populates="events")


engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def init_db() -> None:
    Base.metadata.create_all(engine)
