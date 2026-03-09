from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from hashlib import sha256

from app.core.database import get_db
from app.models.community import CommunityPost

router = APIRouter(prefix="/community", tags=["community"])


class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    author_name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=4, max_length=50)


class PostUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    password: str = Field(..., min_length=4, max_length=50)


class PostDeleteRequest(BaseModel):
    password: str


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    author_name: str
    views: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class PostListItem(BaseModel):
    id: int
    title: str
    author_name: str
    views: int
    created_at: str

    model_config = {"from_attributes": True}


class PostListResponse(BaseModel):
    items: list[PostListItem]
    total: int
    page: int
    per_page: int


def _hash_pw(pw: str) -> str:
    return sha256(pw.encode()).hexdigest()


@router.get("/posts", response_model=PostListResponse)
def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(CommunityPost).count()
    posts = (
        db.query(CommunityPost)
        .order_by(CommunityPost.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    items = [
        PostListItem(
            id=p.id,
            title=p.title,
            author_name=p.author_name,
            views=p.views,
            created_at=p.created_at.isoformat(),
        )
        for p in posts
    ]
    return PostListResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    post.views += 1
    db.commit()
    db.refresh(post)
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        author_name=post.author_name,
        views=post.views,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.post("/posts", response_model=PostResponse, status_code=201)
def create_post(body: PostCreate, db: Session = Depends(get_db)):
    post = CommunityPost(
        title=body.title,
        content=body.content,
        author_name=body.author_name,
        password=_hash_pw(body.password),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        author_name=post.author_name,
        views=post.views,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(post_id: int, body: PostUpdate, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.password != _hash_pw(body.password):
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")
    post.title = body.title
    post.content = body.content
    db.commit()
    db.refresh(post)
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        author_name=post.author_name,
        views=post.views,
        created_at=post.created_at.isoformat(),
        updated_at=post.updated_at.isoformat(),
    )


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(post_id: int, body: PostDeleteRequest, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.password != _hash_pw(body.password):
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")
    db.delete(post)
    db.commit()
