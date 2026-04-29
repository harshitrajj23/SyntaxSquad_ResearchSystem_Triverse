from pydantic import BaseModel, Field
from typing import List, Optional, Any, Union, Dict

class ResearchPaper(BaseModel):
    title: str
    url: str
    citation: str
    rating: float
    abstract: Optional[str] = None
    authors: Optional[str] = None
    year: Optional[int] = None
    source: Optional[str] = None


class UserProfile(BaseModel):
    # Allow both legacy List[str] and new RL-powered Dict preference object
    preferences: Union[List[str], Dict[str, Any]] = Field(..., example={"dominant": "code", "weights": {"code": 5, "short": 0}})
    level: str = Field(..., example="beginner")
    table_intent: Optional[bool] = Field(False, description="Internal flag to indicate if a table was requested")
    research_mode: Optional[str] = Field(None, description="Internal flag for detected intent mode")

class ChatMessage(BaseModel):
    role: str = Field(..., example="user")
    content: str = Field(..., example="Hello, how are you?")

class AskRequest(BaseModel):
    query: Optional[str] = Field(None, example="How do I use async in Python?")
    messages: Optional[List[ChatMessage]] = Field(None, example=[{"role": "user", "content": "Hi"}])
    user_profile: UserProfile
    user_id: str = Field(..., example="user_123")
    chat_id: Optional[str] = Field(None, description="Existing chat ID to continue a conversation")
    mode: Optional[str] = Field(None, description="Manual research mode override: learning | building | exploring | academic")

class AskResponse(BaseModel):
    answer: str
    type: str = Field(..., description="code-heavy | short | explanation")
    recommendations: List[str]
    chat_id: str = Field(..., description="The ID of the chat session")
    mode: Optional[str] = Field(None, description="learning | building | exploring | academic")
    papers: Optional[List[ResearchPaper]] = Field(None, description="Related research papers")

class FeedbackRequest(BaseModel):
    user_id: str
    query: str
    liked: bool
    type: str

class RecommendationResponse(BaseModel):
    recommendations: List[str]


