import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client 
import random 
from typing import Optional, List
import traceback # For detailed error logging

# CORS Middleware
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") 
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") # Currently not used for direct JWT parsing in this version

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


app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:3000", # Common React dev port
    "http://localhost:5173", # Common Vite dev port
    # Add your deployed frontend URL here if applicable
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
# --- End CORS Configuration ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # "token" is a dummy URL here

class ProfileUpdate(BaseModel):
    interests: list[str]

async def get_current_user_data_from_token(token: str = Depends(oauth2_scheme)):
    if not supabase_service_client:
        print("Error: Supabase client not initialized in get_current_user_data_from_token.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized on the server.",
        )
    try:
        user_response = supabase_service_client.auth.get_user(token)

        if user_response and user_response.user:
            return user_response.user
        else:
            error_detail = "Invalid authentication credentials"
            if hasattr(user_response, 'error') and user_response.error and hasattr(user_response.error, 'message'):
                error_detail = user_response.error.message
            elif hasattr(user_response, 'error'): 
                 error_detail = str(user_response.error) 
            print(f"Auth error for token (get_current_user_data_from_token): {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_detail,
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e: 
        print(f"Token validation exception (get_current_user_data_from_token): {e}") 
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

service_headers = {}
if SUPABASE_SERVICE_KEY:
    service_headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
    }
else:
    print("Warning: SUPABASE_SERVICE_KEY not set, service_headers for direct Supabase calls will be incomplete.")


async def _fetch_user_profile_interests(user_id: str) -> List[str]:
    if not (SUPABASE_URL and service_headers.get("apikey")):
        print(f"Error: Supabase URL or service key not configured for fetching profile for user {user_id}.")
        return [] 
    
    print(f"Fetching interests for user_id: {user_id}")
    try:
        async with httpx.AsyncClient() as client:
            profile_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?select=interests&id=eq.{user_id}",
                headers=service_headers
            )
        
        print(f"Profile fetch response for user {user_id}: status={profile_response.status_code}, content={profile_response.text[:200]}")
        
        if profile_response.status_code == 200:
            profiles_data = profile_response.json()
            if profiles_data and isinstance(profiles_data, list) and len(profiles_data) > 0:
                profile = profiles_data[0]
                if "interests" in profile and isinstance(profile["interests"], list):
                    print(f"Found interests for user {user_id}: {profile['interests']}")
                    return [str(interest) for interest in profile["interests"] if interest is not None] 
                else:
                    print(f"No 'interests' array found or not a list in profile for user {user_id}.")
            else:
                print(f"Profile for user {user_id} is empty or not in expected list format.")
        else:
            print(f"Could not fetch profile for interests for user {user_id}, status: {profile_response.status_code}, details: {profile_response.text}")
    except Exception as e:
        print(f"Exception while fetching profile interests for user {user_id}: {e}")
        traceback.print_exc()
    return [] 


@app.get("/daily-quote")
async def get_daily_quote(authorization: Optional[str] = Header(None)):
    if not supabase_service_client:
        print("Error: Supabase client not initialized in /daily-quote.")
        raise HTTPException(status_code=500, detail="Supabase client not initialized on the server.")
    
    user_interests: List[str] = []
    current_user_id: Optional[str] = None

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        print(f"Token found in /daily-quote header, attempting to get user...")
        try:
            user_response_for_quote = supabase_service_client.auth.get_user(token)
            if user_response_for_quote and user_response_for_quote.user:
                current_user_id = user_response_for_quote.user.id
                print(f"User identified for personalized quote: {current_user_id}")
            elif hasattr(user_response_for_quote, 'error') and user_response_for_quote.error:
                 print(f"Token in /daily-quote invalid/expired: {getattr(user_response_for_quote.error, 'message', str(user_response_for_quote.error))}")
            else: 
                print("Token in /daily-quote did not resolve to a user, but no explicit error from get_user.")
        except Exception as e:
            print(f"Exception during optional auth for /daily-quote: {e}")
            traceback.print_exc()
    else:
        print("No authorization header or not Bearer token in /daily-quote. Proceeding as anonymous.")

    if current_user_id:
        user_interests = await _fetch_user_profile_interests(current_user_id)

    quotes_to_choose_from = []
    selected_quote_data = None

    try:
        # 1. Attempt to fetch quotes based on user's interests (if any)
        if user_interests:
            print(f"Attempting to fetch quotes for user interests: {user_interests}")
            valid_interests = [interest for interest in user_interests if isinstance(interest, str) and interest.strip()]
            if valid_interests:
                result_interests = supabase_service_client.table("quotes") \
                    .select("text, author, category") \
                    .in_("category", valid_interests) \
                    .execute()
                
                print(f"Type of result_interests: {type(result_interests)}")
                interests_error = getattr(result_interests, 'error', 'ERROR_ATTRIBUTE_MISSING')
                interests_data = getattr(result_interests, 'data', None)
                print(f"Query for user interests ({valid_interests}) data (first 2): {interests_data[:2] if interests_data else 'No data'}")
                print(f"Query for user interests error attribute: {interests_error}")

                if interests_error != 'ERROR_ATTRIBUTE_MISSING' and interests_error is not None:
                     print(f"Supabase error (user interests query): {getattr(interests_error, 'message', str(interests_error))}")
                elif interests_data:
                    quotes_to_choose_from.extend(interests_data)
            else:
                print("User interests list was empty or contained invalid entries after validation.")

        # 2. If no quotes from user interests, or user has no interests/not logged in, try 'general' category
        if not quotes_to_choose_from:
            print("No quotes for specific interests or user has no interests/not logged in. Fetching 'general' quotes.")
            result_general = supabase_service_client.table("quotes") \
                .select("text, author, category") \
                .eq("category", "general") \
                .execute()

            print(f"Type of result_general: {type(result_general)}")
            general_error = getattr(result_general, 'error', 'ERROR_ATTRIBUTE_MISSING')
            general_data = getattr(result_general, 'data', None)
            print(f"Query for 'general' category data (first 2): {general_data[:2] if general_data else 'No data'}")
            print(f"Query for 'general' category error attribute: {general_error}")
            
            if general_error != 'ERROR_ATTRIBUTE_MISSING' and general_error is not None:
                print(f"Supabase error (general category query): {getattr(general_error, 'message', str(general_error))}")
            elif general_data:
                quotes_to_choose_from.extend(general_data)
        
        # 3. If still no quotes, fetch any quote as a last resort
        if not quotes_to_choose_from:
            print("No 'general' quotes found. Fetching any quote.")
            result_any = supabase_service_client.table("quotes") \
                .select("text, author, category") \
                .execute() 

            print(f"Type of result_any: {type(result_any)}")
            any_error = getattr(result_any, 'error', 'ERROR_ATTRIBUTE_MISSING')
            any_data = getattr(result_any, 'data', None)
            print(f"Query for any quote data (first 2): {any_data[:2] if any_data else 'No data'}")
            print(f"Query for any quote error attribute: {any_error}")

            if any_error != 'ERROR_ATTRIBUTE_MISSING' and any_error is not None:
                print(f"Supabase error (any quote query): {getattr(any_error, 'message', str(any_error))}")
            elif any_data:
                quotes_to_choose_from.extend(any_data)

        # Process the gathered quotes
        if quotes_to_choose_from:
            valid_quotes = [q for q in quotes_to_choose_from if isinstance(q, dict) and q.get("text")]
            if valid_quotes:
                selected_quote_data = random.choice(valid_quotes)
                print(f"Selected quote: {selected_quote_data}")
                return {
                    "quote": selected_quote_data.get("text", "Quote text not found."),
                    "author": selected_quote_data.get("author", "Unknown")
                }
        
        print("No quotes found after all fallbacks.")
        return {"quote": "We're fresh out of quotes for you right now! Check back later.", "author": "The Universe"}

    except Exception as e:
        print(f"Unexpected error in /daily-quote processing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@app.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user_data_from_token)):
    if not supabase_service_client:
        print("Error: Supabase client not initialized in /me (GET).")
        raise HTTPException(status_code=500, detail="Supabase client not initialized on the server.")

    user_id = current_user.id
    print(f"Fetching profile for user_id: {user_id} via /me endpoint")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.{user_id}",
                headers=service_headers
            )
        print(f"GET /me response status: {response.status_code}, content: {response.text[:500]}")
        response.raise_for_status() 
        profiles = response.json()
        if profiles:
            return profiles[0] 
        else:
            print(f"Profile not found for user_id: {user_id} in /me. Attempting to create one.")
            try:
                new_profile_data = {"id": user_id, "interests": []} 
                create_response = supabase_service_client.table("profiles").insert(new_profile_data).execute()
                
                create_error = getattr(create_response, 'error', 'ERROR_ATTRIBUTE_MISSING')
                create_data = getattr(create_response, 'data', None)

                if create_error != 'ERROR_ATTRIBUTE_MISSING' and create_error is not None:
                    print(f"Error creating profile for user_id {user_id} via /me: {getattr(create_error, 'message', str(create_error))}")
                    raise HTTPException(status_code=500, detail=f"Could not create profile: {getattr(create_error, 'message', str(create_error))}")
                elif create_data:
                    print(f"Successfully created profile for user_id: {user_id} via /me")
                    return create_data[0]
                else: 
                    raise HTTPException(status_code=500, detail="Failed to create profile via /me, no data or error returned from Supabase.")
            except Exception as e_create:
                print(f"Exception while creating profile for user_id {user_id} via /me: {e_create}")
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=f"An error occurred while trying to create profile via /me: {str(e_create)}")

    except httpx.HTTPStatusError as e:
        print(f"HTTP error fetching profile for user_id {user_id} via /me: {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Error fetching profile via /me: {e.response.text}")
    except Exception as e:
        print(f"Unexpected error fetching profile for user_id {user_id} via /me: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching the profile via /me.")


@app.put("/me")
async def update_my_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user_data_from_token)):
    if not supabase_service_client: 
        print("Error: Supabase client not initialized in /me (PUT).")
        raise HTTPException(status_code=500, detail="Supabase client not initialized on the server.")

    user_id_to_update = current_user.id 
    sanitized_interests = [str(interest) for interest in data.interests if interest is not None]
    payload = {"interests": sanitized_interests} 
    
    print(f"Updating profile for user_id: {user_id_to_update} with interests: {sanitized_interests} via /me (PUT)")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id_to_update}", 
                headers={**service_headers, "Content-Type": "application/json", "Prefer": "return=representation"},
                json=payload 
            )
        print(f"PUT /me response status: {response.status_code}, content: {response.text[:500]}")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        print(f"HTTP error updating profile for user_id {user_id_to_update} via /me (PUT): {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=f"Error updating profile via /me (PUT): {e.response.text}")
    except Exception as e:
        print(f"Unexpected error updating profile for user_id {user_id_to_update} via /me (PUT): {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="An unexpected error occurred while updating the profile via /me (PUT).")

