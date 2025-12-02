from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware
from core import settings
from api.v1 import api_router

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "AliExpress Supplier Search API"}