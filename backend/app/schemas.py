from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from .models import ApplicationStatus


class ApplicationCreate(BaseModel):
    company: str
    role: str
    status: ApplicationStatus = ApplicationStatus.applied
    job_description: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    applied_date: date
    follow_up_date: Optional[date] = None
    resume_used: Optional[str] = None
    cover_letter_used: Optional[bool] = None
    resume_file_path: Optional[str] = None
    cover_letter_file_path: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter_url: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None

    @field_validator('resume_url', 'cover_letter_url', mode='before')
    @classmethod
    def validate_url(cls, v):
        if v is not None and v != '' and not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    job_description: Optional[str] = None
    notes: Optional[str] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    applied_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    resume_used: Optional[str] = None
    cover_letter_used: Optional[bool] = None
    resume_file_path: Optional[str] = None
    cover_letter_file_path: Optional[str] = None
    resume_url: Optional[str] = None
    cover_letter_url: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None

    @field_validator('resume_url', 'cover_letter_url', mode='before')
    @classmethod
    def validate_url(cls, v):
        if v is not None and v != '' and not v.startswith(('http://', 'https://')):
            raise ValueError('URL must start with http:// or https://')
        return v


class ApplicationResponse(BaseModel):
    id: str
    user_id: int
    company: str
    role: str
    status: ApplicationStatus
    job_description: Optional[str]
    notes: Optional[str]
    location: Optional[str]
    job_url: Optional[str]
    salary_min: Optional[int]
    salary_max: Optional[int]
    applied_date: date
    follow_up_date: Optional[date]
    resume_used: Optional[str]
    cover_letter_used: Optional[bool]
    resume_file_path: Optional[str]
    cover_letter_file_path: Optional[str]
    resume_url: Optional[str]
    cover_letter_url: Optional[str]
    contact_person: Optional[str]
    contact_email: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedApplications(BaseModel):
    items: list[ApplicationResponse]
    total: int
    skip: int
    limit: int


class UserResponse(BaseModel):
    id: int
    login: str
    email: Optional[str]
    avatar_url: Optional[str]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class FunnelItem(BaseModel):
    status: ApplicationStatus
    count: int


class TimelineItem(BaseModel):
    date: date
    count: int


class MatcherRequest(BaseModel):
    resume: str
    job_description: str


class MatcherResponse(BaseModel):
    matched: list[str]
    missing: list[str]
    score: float
