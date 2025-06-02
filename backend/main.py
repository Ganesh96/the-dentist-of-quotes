import os
import httpx
from fastapi import FastAPI, Depends
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

app = FastAPI()

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

class ProfileUpdate(BaseModel):
    interests: list[str]

@app.get("/me")
async def get_profile():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SUPABASE_URL}/rest/v1/profiles?select=*",
            headers=headers
        )
    return response.json()

@app.put("/me")
async def update_profile(data: ProfileUpdate):
    user_id = "00000000-0000-0000-0000-000000000001"  # mock for now

    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers={**headers, "Content-Type": "application/json"},
            json={"interests": data.interests}
        )
    return {"message": "Updated", "response": response.json()}


'''
# CORS Middleware Configuration
This section is used to allow cross-origin requests from a specific frontend application.
'''
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
