import os
import httpx
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client # Import Supabase client
import random # For the daily quote example

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") # Used for backend operations
# SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") # Might be needed if you initialize client for user context
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") # Store your Supabase JWT secret in .env

# Initialize Supabase client (can be used for validation or other calls)
# This service client is for backend's own elevated privilege calls
supabase_service_client: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

# Scheme for extracting the Bearer token from the Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # "token" is a dummy URL here

class ProfileUpdate(BaseModel):
    interests: list[str]

async def get_current_user_data_from_token(token: str = Depends(oauth2_scheme)):
    """
    Validates the Supabase JWT and returns the user data.
    Relies on Supabase client to verify the token.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY: # Or ANON_KEY depending on approach
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase URL or Key not configured on the server.",
        )
    try:
        # It's often better to use the anon key for user context validation
        # or a dedicated method if the supabase-py client offers one for pure token validation.
        # For this example, we re-create a client instance scoped to the user's token to verify.
        # This specific method of validation might vary based on supabase-py versions.
        # The key is to use a Supabase provided utility to validate the token.

        # One way to verify with supabase-py: set session for a temporary client
        # (usually with anon key, but service key could also work if permissions are set)
        # This is just illustrative; check supabase-py docs for the most current best practice.
        
        # A common pattern is to use the user's token to initialize a client
        # that acts on behalf of that user.
        # For just getting the user ID, you might use:
        user_response = supabase_service_client.auth.get_user(token)

        if user_response and user_response.user:
            return user_response.user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e: # Catch any exception during token validation
        print(f"Token validation error: {e}") # Log the error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Headers for the service client's direct Supabase API calls
service_headers = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"
}

@app.get("/daily-quote")
def get_daily_quote():
    # This endpoint doesn't require authentication in this example
    result = supabase_service_client.table("quotes").select("*").execute()
    if result.data:
        quote_data = random.choice(result.data)
        # Ensure 'text' key exists, use .get for 'author'
        return {"quote": quote_data.get("text", "Quote text not found"), "author": quote_data.get("author", "Unknown")}
    return {"quote": "No quotes available", "author": ""}


@app.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user_data_from_token)):
    user_id = current_user.id
    async with httpx.AsyncClient() as client:
        # Use service_headers for this call as the backend is fetching data using its privileged access
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.{user_id}", # Filter by authenticated user's ID
            headers=service_headers
        )
    response.raise_for_status() # Raise an exception for HTTP error codes
    profiles = response.json()
    if profiles:
        return profiles[0] # Return the single profile object
    else:
        # Optionally create a profile if it doesn't exist, or return 404
        raise HTTPException(status_code=404, detail="Profile not found")


@app.put("/me")
async def update_my_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user_data_from_token)):
    user_id_to_update = current_user.id # Get user ID from validated token

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id_to_update}", # Ensure you only update the authenticated user's profile
            headers={**service_headers, "Content-Type": "application/json", "Prefer": "return=representation"}, # return=representation to get updated data
            json={"interests": data.interests, "id": user_id_to_update} # Ensure 'id' is part of the update payload if needed by RLS
        )
    response.raise_for_status() # Raise an exception for HTTP error codes
    return response.json()


# CORS Middleware Configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]  # This was likely the inner list of arguments
) # This closes the app.add_middleware call