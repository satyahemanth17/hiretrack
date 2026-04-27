import re

from fastapi import APIRouter, Depends, Request

from ..auth import get_current_user
from ..limiter import limiter
from ..schemas import MatcherRequest, MatcherResponse

router = APIRouter(prefix="/matcher", tags=["matcher"])

# 63 keywords covering languages, frameworks, databases, cloud, ML, and practices
KEYWORDS: list[str] = [
    # Languages
    "python", "javascript", "typescript", "java", "go", "rust",
    "c++", "c#", "ruby", "swift", "kotlin", "scala", "php", "bash",
    # Web frameworks
    "react", "vue", "angular", "svelte", "next.js", "fastapi", "django",
    "flask", "express", "spring", "rails", "laravel",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "cassandra", "dynamodb", "sqlite", "neo4j", "clickhouse",
    # Cloud / Infra
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
    "ansible", "jenkins", "github actions", "circleci", "helm",
    # ML / Data
    "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
    "spark", "kafka", "airflow", "dbt", "tableau",
    # Practices / Tools
    "git", "graphql", "rest", "grpc", "microservices", "ci/cd",
    "agile", "tdd", "jwt", "oauth", "linux",
]


def _find_keywords(text: str, keywords: list[str]) -> set[str]:
    found: set[str] = set()
    text_lower = text.lower()
    for kw in keywords:
        escaped = re.escape(kw)
        # Word boundary before keyword; trailing boundary only if keyword ends with a word char
        if kw[-1].isalnum() or kw[-1] == "_":
            pattern = rf"\b{escaped}\b"
        else:
            pattern = rf"\b{escaped}"
        if re.search(pattern, text_lower):
            found.add(kw)
    return found


@router.post("/analyze", response_model=MatcherResponse)
@limiter.limit("20/minute")
def analyze(
    request: Request,
    payload: MatcherRequest,
    current_user: dict = Depends(get_current_user),
) -> MatcherResponse:
    jd_keywords = _find_keywords(payload.job_description, KEYWORDS)
    resume_keywords = _find_keywords(payload.resume, KEYWORDS)
    matched = sorted(jd_keywords & resume_keywords)
    missing = sorted(jd_keywords - resume_keywords)
    score = round(len(matched) / len(jd_keywords), 2) if jd_keywords else 0.0
    return MatcherResponse(matched=matched, missing=missing, score=score)
