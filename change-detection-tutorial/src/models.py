from pydantic import BaseModel
from typing import List


class Article(BaseModel):
    url: str
    title: str


class ArticleList(BaseModel):
    articles: List[Article]
