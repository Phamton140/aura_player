from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import audio_transcription

app = FastAPI(title="AuraPlayer AI Backend", version="1.1.1")

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(audio_transcription.router, prefix="/api/audio", tags=["Audio Transcription"])

@app.get("/")
async def root():
    return {"message": "AuraPlayer AI API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
