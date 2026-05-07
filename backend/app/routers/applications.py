import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Application, ApplicationStatus
from ..schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
    PaginatedApplications,
)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=PaginatedApplications)
def list_applications(
    status: ApplicationStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> PaginatedApplications:
    user_id = int(current_user["sub"])
    q = db.query(Application).filter(Application.user_id == user_id)
    if status is not None:
        q = q.filter(Application.status == status)
    total = q.count()
    items = q.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()
    return PaginatedApplications(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = Application(
        id=str(uuid.uuid4()),
        user_id=int(current_user["sub"]),
        **payload.model_dump(),
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return app_obj


@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> ApplicationResponse:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app_obj, field, value)
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.delete("/{app_id}", status_code=204)
def delete_application(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    app_obj = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.user_id == int(current_user["sub"]),
        )
        .first()
    )
    if app_obj is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app_obj)
    db.commit()


@router.post("/{app_id}/resume", response_model=ApplicationResponse)
async def upload_resume(
    app_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    app_obj = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == int(current_user["sub"]),
    ).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    original_name = os.path.basename(file.filename or "upload")
    _, ext = os.path.splitext(original_name)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{app_id}_resume_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, safe_name), "wb") as f:
        f.write(contents)

    app_obj.resume_filename = original_name
    app_obj.resume_file_path = safe_name
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}/resume")
def download_resume(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    app_obj = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == int(current_user["sub"]),
    ).first()
    if not app_obj or not app_obj.resume_file_path:
        raise HTTPException(status_code=404, detail="No resume uploaded")
    file_path = os.path.join(UPLOAD_DIR, app_obj.resume_file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=app_obj.resume_filename or app_obj.resume_file_path)


@router.post("/{app_id}/cover-letter", response_model=ApplicationResponse)
async def upload_cover_letter(
    app_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    app_obj = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == int(current_user["sub"]),
    ).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    original_name = os.path.basename(file.filename or "upload")
    _, ext = os.path.splitext(original_name)
    if ext.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5 MB.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{app_id}_coverletter_{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, safe_name), "wb") as f:
        f.write(contents)

    app_obj.cover_letter_filename = original_name
    app_obj.cover_letter_file_path = safe_name
    db.commit()
    db.refresh(app_obj)
    return app_obj


@router.get("/{app_id}/cover-letter")
def download_cover_letter(
    app_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    app_obj = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == int(current_user["sub"]),
    ).first()
    if not app_obj or not app_obj.cover_letter_file_path:
        raise HTTPException(status_code=404, detail="No cover letter uploaded")
    file_path = os.path.join(UPLOAD_DIR, app_obj.cover_letter_file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=app_obj.cover_letter_filename or app_obj.cover_letter_file_path)
