from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from hashlib import sha256

from app.core.database import get_db
from app.models.community import CommunityComment, CommunityPost

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
    comment_count: int = 0
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
    # Get comment counts
    post_ids = [p.id for p in posts]
    comment_counts: dict[int, int] = {}
    if post_ids:
        rows = (
            db.query(CommunityComment.post_id, func.count(CommunityComment.id))
            .filter(CommunityComment.post_id.in_(post_ids))
            .group_by(CommunityComment.post_id)
            .all()
        )
        comment_counts = {pid: cnt for pid, cnt in rows}
    items = [
        PostListItem(
            id=p.id,
            title=p.title,
            author_name=p.author_name,
            views=p.views,
            comment_count=comment_counts.get(p.id, 0),
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


# ── Comments ──────────────────────────────────────────────


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    author_name: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=4, max_length=50)


class CommentResponse(BaseModel):
    id: int
    post_id: int
    content: str
    author_name: str
    created_at: str

    model_config = {"from_attributes": True}


class CommentDeleteRequest(BaseModel):
    password: str


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    comments = (
        db.query(CommunityComment)
        .filter(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at.asc())
        .all()
    )
    return [
        CommentResponse(
            id=c.id,
            post_id=c.post_id,
            content=c.content,
            author_name=c.author_name,
            created_at=c.created_at.isoformat(),
        )
        for c in comments
    ]


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(post_id: int, body: CommentCreate, db: Session = Depends(get_db)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    comment = CommunityComment(
        post_id=post_id,
        content=body.content,
        author_name=body.author_name,
        password=_hash_pw(body.password),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        content=comment.content,
        author_name=comment.author_name,
        created_at=comment.created_at.isoformat(),
    )


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, body: CommentDeleteRequest, db: Session = Depends(get_db)):
    comment = db.query(CommunityComment).filter(CommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.password != _hash_pw(body.password):
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")
    db.delete(comment)
    db.commit()
