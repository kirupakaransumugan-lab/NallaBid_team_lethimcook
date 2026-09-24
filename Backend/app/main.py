from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models.user import User
from app.routers import suppliers, quotations, imports, reports

from app.routers.auth import router as auth_router
from app.routers import RFQs


app = FastAPI(
    title="NallBid API",
    description="SME RFQ & Supplier Evaluation Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(
    auth_router,
    prefix="/api"
)
 #Register Gideon routers
app.include_router(suppliers.router)
app.include_router(quotations.router)
app.include_router(imports.router)
app.include_router(reports.router)


app.include_router(
    rfqs.router,
    prefix="/api"
)

@app.get("/")
def root():
    return {
        "message": "NallaBid API is running"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"
    }