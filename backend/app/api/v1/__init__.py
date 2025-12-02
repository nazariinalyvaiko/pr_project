from fastapi import APIRouter
from api.v1.endpoints import suppliers

api_router = APIRouter()
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])