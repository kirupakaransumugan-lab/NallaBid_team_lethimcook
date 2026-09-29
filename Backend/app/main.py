from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
from app.models.user import User
from app.routers import suppliers, quotations, imports, supplier_rfqs
from app.routers import awards, evaluations, reports, buyer_workspace, users

from app.routers.auth import router as auth_router
from app.routers import RFQs
from app.security.auth import get_current_user
from app.services.rfq_lifecycle import close_expired_rfqs


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

# Buyer-side routers first close any OPEN RFQ whose deadline has passed.
AUTO_CLOSE = [Depends(close_expired_rfqs)]


app.include_router(
    auth_router,
    prefix="/api"
)
# Register Gideon routers
# Supplier contact details are not public: any logged-in user, but never anonymous.
app.include_router(suppliers.router, dependencies=[Depends(get_current_user)])
app.include_router(quotations.router, dependencies=AUTO_CLOSE)
app.include_router(imports.router)
app.include_router(supplier_rfqs.router, prefix="/api", dependencies=AUTO_CLOSE)


app.include_router(
    RFQs.router,
    prefix="/api",
    dependencies=AUTO_CLOSE
)

app.include_router(
    evaluations.router,
    prefix="/api",
    dependencies=AUTO_CLOSE
)

app.include_router(
    awards.router,
    prefix="/api",
    dependencies=AUTO_CLOSE
)

app.include_router(
    reports.router,
    prefix="/api",
    dependencies=AUTO_CLOSE
)

app.include_router(
    buyer_workspace.router,
    prefix="/api",
    dependencies=AUTO_CLOSE
)

app.include_router(
    users.router,
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
