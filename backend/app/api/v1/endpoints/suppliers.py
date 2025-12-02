from fastapi import APIRouter, HTTPException
from schemas.supplier import SearchRequest, SearchResponse
from services.aliexpress_service import AliExpressService
import traceback

router = APIRouter()
aliexpress_service = AliExpressService()


@router.post("/search", response_model=SearchResponse)
async def search_suppliers(request: SearchRequest):
    if not request.product_name or not request.product_name.strip():
        raise HTTPException(status_code=400, detail="Product name cannot be empty")
    
    try:
        suppliers_data = await aliexpress_service.search_suppliers(
            request.product_name.strip(),
            5
        )
        
        return SearchResponse(
            suppliers=suppliers_data,
            query=request.product_name
        )
    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for suppliers: {error_msg}"
        )


@router.get("/search", response_model=SearchResponse)
async def search_suppliers_get(product_name: str):
    if not product_name or not product_name.strip():
        raise HTTPException(status_code=400, detail="Product name cannot be empty")
    
    try:
        suppliers_data = await aliexpress_service.search_suppliers(
            product_name.strip(),
            5
        )
        
        return SearchResponse(
            suppliers=suppliers_data,
            query=product_name
        )
    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Error searching for suppliers: {error_msg}"
        )

