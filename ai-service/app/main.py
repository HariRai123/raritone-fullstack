from fastapi import FastAPI
from app.api.routes.analyze import router as analyze_router

app = FastAPI(
    title="Raritone AI Try-On Service",
    version="1.0.0"
)

app.include_router(
    analyze_router,
    prefix="/api"
)


@app.get("/")
async def root():
    return {
        "message": "Raritone AI service is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "raritone-ai"
    }