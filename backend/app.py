import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.request_models import AskRequest, AskResponse, FeedbackRequest, RecommendationResponse
from services.llm_service import LLMService
from services.behavior_engine import behavior_engine
from services.interest_engine import interest_engine
from services.recommendation_engine import recommendation_engine
from services.db_service import supabase, create_chat, save_message, get_user_chats, get_chat_messages, get_user_profile, get_interaction_history, get_chat_sessions_with_previews
from services.research_service import research_service
from utils.logger import logger
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Research Assistant ML Service",
    description="Production-ready ML microservice for self-evolving AI research assistant",
    version="1.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = LLMService()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    # Normalize input
    messages = request.messages or []
    query = request.query
    
    # Safe logging
    if messages:
        logger.info(f"Received conversational request with {len(messages)} messages")
        logger.debug(f"Incoming messages: {messages}")
    elif query:
        logger.info(f"Received query: {query}")
    
    if not query and not messages:
        raise HTTPException(status_code=400, detail="Either 'query' or 'messages' must be provided.")
    
    try:
        # 1. Extract and Validate user_id
        user_id = request.user_id
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        
        logger.info(f"Processing /ask request for user_id: {user_id}")
        
        # 2. Get learned preferences from behavior engine
        learned_preferences = behavior_engine.get_user_preferences(user_id)
        incoming_preferences = request.user_profile.preferences
        
        # 3. Merge logic: Learned preferences OVERRIDE incoming ones if they exist
        if learned_preferences:
            final_preferences = learned_preferences
            logger.info(f"Learned preferences found for {user_id}. Overriding incoming preferences.")
        else:
            final_preferences = incoming_preferences
            logger.info(f"No learned preferences for {user_id}. Using incoming preferences.")
            
        # Update the profile with final preferences
        final_profile = request.user_profile.copy()
        final_profile.preferences = final_preferences
        
        # 4. Detailed Logging for debugging
        logger.info(f"--- PREFERENCE SUMMARY FOR {user_id} ---")
        logger.info(f"Incoming: {incoming_preferences}")
        logger.info(f"Learned:  {learned_preferences}")
        logger.info(f"Final:    {final_preferences}")
        logger.info(f"---------------------------------------")
        
        # 5. Handle Persistent Chat History
        chat_id = request.chat_id
        
        # If continuing a chat, fetch history from DB if messages are not provided
        if not chat_id:
            # Create a new chat on the first message
            display_query = query or (messages[-1].content if messages else "New Chat")
            chat_title = (display_query[:37] + "...") if len(display_query) > 40 else display_query
            new_chat = create_chat(user_id, chat_title)
            chat_id = new_chat["id"]
            logger.info(f"Created new chat: {chat_id} with title: {chat_title}")
        
        # 5b. Track Interest & Fetch Updated Profile
        display_query_for_interest = query or (messages[-1].content if messages else "")
        user_interests = {}
        dominant_interest = None
        if display_query_for_interest:
            interest_result = interest_engine.update_interests(user_id, display_query_for_interest)
            if interest_result:
                user_interests = interest_result.get("interests", {})
                dominant_interest = interest_result.get("dominant_interest")
        else:
            # No query text — still try to load existing profile for context
            existing_profile = get_user_profile(user_id)
            if existing_profile and existing_profile.get("interests"):
                user_interests = existing_profile["interests"]
                # Determine top topic for dominant interest
                top_topic = max(user_interests, key=user_interests.get)
                dominant_interest = interest_engine.DOMINANT_INTEREST_MAPPING.get(top_topic, "curious explorer")

        # Save user message if query is provided
        if query:
            save_message(chat_id, "user", query)
        
        # 6. Generate answer using final profile
        # To maintain context, we'll fetch existing history from DB if request.messages is empty
        history = [m.model_dump() for m in messages] if messages else None
        
        if not history and chat_id:
            db_history = get_chat_messages(chat_id)
            if db_history:
                # If query was provided, we just saved it to DB, so skip the last one in history
                # If query was NOT provided (pure conversational), we want the full history
                if query:
                    history = [{"role": m["role"], "content": m["content"]} for m in db_history[:-1]]
                else:
                    history = [{"role": m["role"], "content": m["content"]} for m in db_history]
        
        # LLM Call Safety: Ensure we have at least one user message or a query
        if not query and not (history and any(m['role'] == 'user' for m in history)):
            raise HTTPException(status_code=400, detail="At least one user message or a query must be provided.")

        logger.debug(f"Final messages sent to LLM: {history}")

        answer, response_type, research_mode = await llm_service.get_answer(
            query,
            final_profile,
            messages=history,
            user_interests=user_interests,
            dominant_interest=dominant_interest,
            manual_mode=request.mode
        )
        
        # Save assistant response to messages table
        save_message(chat_id, "assistant", answer)
        
        # Save interaction to interactions table for history (liked=None)
        try:
            interaction_data = {
                "user_id": user_id,
                "query": query or (messages[-1].content if messages else "No query"),
                "response_type": response_type,
                "liked": None,
                "chat_id": chat_id,
                "research_mode": research_mode
            }
            supabase.table("interactions").insert(interaction_data).execute()
            logger.info(f"Logged interaction for user_id: {user_id}")
        except Exception as e:
            logger.error(f"Failed to log interaction to history: {str(e)}")
            # Don't fail the request if logging to history fails
        
        recommendations = llm_service.get_static_recommendations()
        
        logger.info(f"Successfully generated response of type: {response_type} | Mode: {research_mode}")
        
        # Fetch relevant research papers ONLY in academic mode
        papers = None
        if research_mode == "academic":
            search_query = query or (messages[-1].content if messages else "")
            if search_query:
                # Running synchronously for now, in production you might want to run this asynchronously or in a background task
                # if performance is a concern
                papers = research_service.get_relevant_papers(search_query)

        return AskResponse(
            answer=answer,
            type=response_type,
            recommendations=recommendations,
            chat_id=chat_id,
            mode=research_mode,
            papers=papers
        )
        
    except Exception as e:
        logger.error(f"Failed to process request: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Receives feedback on a response, stores it in Supabase, and updates behavior engine.
    """
    user_id = request.user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    logger.info(f"Received feedback from {user_id} for type {request.type}: Liked={request.liked}")
    
    try:
        # 1. Store data in Supabase
        interaction_data = {
            "user_id": request.user_id,
            "query": request.query,
            "response_type": request.type,
            "liked": request.liked
        }
        supabase.table("interactions").insert(interaction_data).execute()
        
        # 2. Update behavior engine
        preference_obj = behavior_engine.process_feedback(request)
        
        return {
            "status": "saved",
            "updated_preferences": preference_obj
        }
    except Exception as e:
        logger.error(f"Failed to record feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Feedback processing failed: {str(e)}")

@app.get("/chats/{user_id}")
async def list_chats(user_id: str):
    """Returns unique chat sessions with previews for a given user."""
    logger.info(f"Fetching chat sessions for user_id: {user_id}")
    try:
        sessions = get_chat_sessions_with_previews(user_id)
        logger.info(f"Retrieved {len(sessions)} chat sessions for user_id: {user_id}")
        return sessions
    except Exception as e:
        logger.error(f"Failed to fetch sessions for {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@app.get("/messages/{chat_id}")
async def get_messages(chat_id: str):
    """Returns the full conversation for a given chat_id."""
    try:
        messages = get_chat_messages(chat_id)
        # Transform to consistent role/content format
        return [{"role": m["role"], "content": m["content"]} for m in messages]
    except Exception as e:
        logger.error(f"Failed to fetch messages for {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch messages")

@app.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(q: str):
    """
    Returns related search recommendations for a given query.
    """
    try:
        recommendations = await recommendation_engine.get_recommendations(q)
        return RecommendationResponse(recommendations=recommendations)
    except Exception as e:
        logger.error(f"Failed to fetch recommendations for {q}: {str(e)}")
        return RecommendationResponse(recommendations=[])

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
