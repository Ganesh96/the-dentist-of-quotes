import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, status, Header, APIRouter
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv # Keep for local development
from supabase import create_client, Client 
import random 
from typing import Optional, List
import traceback 

# CORS Middleware
from fastapi.middleware.cors import CORSMiddleware

# Load .env only for local development. Vercel uses its own env var system.
if os.getenv("VERCEL") is None: # VERCEL is a default env var on Vercel
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") 

# Initialize Supabase client
supabase_service_client: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase_service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("Supabase client initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
else:
    print("SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables not set. Backend functionality will be limited.")

# Create an APIRouter instance if you want to prefix all routes from this file
# This is useful if main.py is included by another FastAPI app, but for Vercel direct deployment,
# app = FastAPI() is fine. The /api prefix will be handled by vercel.json rewrites.
app = FastAPI() # Main app instance for Vercel
# If you were to use APIRouter for prefixing within FastAPI:
# router = APIRouter(prefix="/api") 

# --- CORS Configuration ---
# For Vercel, VERCEL_URL will contain the main deployment URL.
# VERCEL_BRANCH_URL will contain preview deployment URLs.
vercel_url = os.getenv("VERCEL_URL") # e.g., your-project.vercel.app (production)
vercel_branch_url = os.getenv("VERCEL_BRANCH_URL") # e.g., your-project-git-branch-org.vercel.app (previews)


origins = [
    "http://localhost:3000", 
    "http://localhost:5173", 
]
if vercel_url: # This is the production URL
    origins.append(f"https://{vercel_url}")
if vercel_branch_url: # This is for preview deployments
    origins.append(f"https://{vercel_branch_url}")
# You might also want to add your custom domain if you have one configured in Vercel
custom_domain = os.getenv("CUSTOM_FRONTEND_DOMAIN") # Set this in Vercel env vars
if custom_domain:
    origins.append(custom_domain)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
# --- End CORS Configuration ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token") # Path relative to API base

class ProfileUpdate(BaseModel):
    interests: list[str]

async def get_current_user_data_from_token(token: str = Depends(oauth2_scheme)):
    if not supabase_service_client:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase client not initialized.")
    try:
        user_response = supabase_service_client.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user
        else:
            error_detail = "Invalid authentication credentials"
            if hasattr(user_response, 'error') and user_response.error:
                error_detail = getattr(user_response.error, 'message', str(user_response.error))
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, error_detail, {"WWW-Authenticate": "Bearer"})
    except Exception as e: 
        traceback.print_exc()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Could not validate credentials: {e}", {"WWW-Authenticate": "Bearer"})

service_headers = {}
if SUPABASE_SERVICE_KEY:
    service_headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}

async def _fetch_user_profile_interests(user_id: str) -> List[str]:
    if not (SUPABASE_URL and service_headers.get("apikey")): return []
    try:
        async with httpx.AsyncClient() as client:
            profile_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?select=interests&id=eq.{user_id}", headers=service_headers)
        if profile_response.status_code == 200:
            data = profile_response.json()
            if data and isinstance(data, list) and data[0].get("interests"):
                return [str(i) for i in data[0]["interests"] if i is not None]
    except Exception as e: print(f"Profile interest fetch error for {user_id}: {e}")
    return []

# Note: The routes below should match what's in vercel.json (without the /api prefix here,
# as vercel.json handles the rewrite from /api/... to this file)
@app.get("/daily-quote") # Vercel will route /api/daily-quote to this
async def get_daily_quote_endpoint(authorization: Optional[str] = Header(None)):
    if not supabase_service_client:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase client not initialized.")
    
    user_interests: List[str] = []
    current_user_id: Optional[str] = None

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            user_res = supabase_service_client.auth.get_user(token)
            if user_res and user_res.user: current_user_id = user_res.user.id
        except Exception: pass # Ignore errors, proceed as anonymous

    if current_user_id: user_interests = await _fetch_user_profile_interests(current_user_id)
    
    quotes_pool = []
    query_attempts = []

    if user_interests:
        query_attempts.append(supabase_service_client.table("quotes").select("text, author").in_("category", user_interests).execute())
    query_attempts.append(supabase_service_client.table("quotes").select("text, author").eq("category", "general").execute())
    query_attempts.append(supabase_service_client.table("quotes").select("text, author").execute()) # Fallback to any

    for res in query_attempts:
        res_data = getattr(res, 'data', None)
        if res_data: quotes_pool.extend(d for d in res_data if isinstance(d, dict) and d.get("text"))
        if quotes_pool: break # Found quotes

    if quotes_pool:
        selected = random.choice(quotes_pool)
        return {"quote": selected.get("text"), "author": selected.get("author", "Unknown")}
    
    return {"quote": "No quotes found today!", "author": "System"}

@app.get("/me") # Vercel will route /api/me to this
async def get_my_profile_endpoint(current_user: dict = Depends(get_current_user_data_from_token)):
    if not supabase_service_client:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase client not initialized.")
    user_id = current_user.id
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.{user_id}", headers=service_headers)
        response.raise_for_status()
        profiles = response.json()
        if profiles: return profiles[0]
        
        # Profile not found, attempt to create
        new_profile_data = {"id": user_id, "interests": []}
        create_res = supabase_service_client.table("profiles").insert(new_profile_data).execute()
        create_data = getattr(create_res, 'data', None)
        if create_data: return create_data[0]
        
        create_error = getattr(create_res, 'error', None)
        err_msg = getattr(create_error, 'message', str(create_error)) if create_error else "Profile creation failed."
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, err_msg)

    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Error fetching profile: {e.response.text}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error processing profile.")

@app.put("/me") # Vercel will route /api/me to this
async def update_my_profile_endpoint(data: ProfileUpdate, current_user: dict = Depends(get_current_user_data_from_token)):
    if not supabase_service_client:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase client not initialized.")
    user_id = current_user.id
    payload = {"interests": [str(i) for i in data.interests if i is not None]}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}", 
                headers={**service_headers, "Content-Type": "application/json", "Prefer": "return=representation"},
                json=payload)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(e.response.status_code, f"Error updating profile: {e.response.text}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Error processing profile update.")

# If you used APIRouter:
# app.include_router(router)

# This is how Vercel expects to find the FastAPI app
# main.py
# from .app import app # if app is defined in app.py
# For this structure, Vercel will find `app = FastAPI()` directly.
