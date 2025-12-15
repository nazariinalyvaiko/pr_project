from pydantic import BaseModel


class SupplierResponse(BaseModel):
    product_name: str
    product_url: str
    price: str
    detailed_price: str
    moq: str
    rating: str
    store_name: str
    store_url: str
    orders: str


class SearchRequest(BaseModel):
    product_name: str


class SearchResponse(BaseModel):
    suppliers: list[SupplierResponse]
    query: str

