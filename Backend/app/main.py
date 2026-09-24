from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.models.user import User
from app.routers import suppliers, quotations, imports
# reports needs models/award.py and models/evaluation.py, which are still empty.
# from app.routers import reports

from app.routers.auth import router as auth_router
from app.routers import RFQs


# Routers above import every model, so all tables are known here.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="NallBid API",
    description="SME RFQ & Supplier Evaluation Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://127.0.0.1:5173"
    ],
    # Vite falls back to 5174, 5175... when 5173 is busy; allow any local dev port.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(
    auth_router,
    prefix="/api"
)
# Register Gideon routers
app.include_router(suppliers.router)
app.include_router(quotations.router)
app.include_router(imports.router)
# app.include_router(reports.router)


app.include_router(
    RFQs.router,
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