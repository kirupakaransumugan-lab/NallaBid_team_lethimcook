# Importing any model imports this package first, so every mapped class is
# registered before SQLAlchemy resolves string relationships like "Award".
from app.models import user, company, rfq, supplier, supplier_catalogue, quotation, evaluation, award  # noqa: F401
