# Bug Fix Report — Supplier Workflow and Project Health Check

This document records the fixes made during the project-wide code health pass.

## Summary

The frontend had lint failures and several Supplier workflow pages still used placeholder behavior. The fixes connect the existing Supplier UI to authenticated backend APIs for available RFQs, RFQ details, quotation submission, and a supplier's quotation list.

The earlier **My Catalogue** feature and CSV import behavior were preserved. The removed product-image feature was not restored.

## Problems found

| Problem | Fix |
| --- | --- |
| `Reports.jsx` imported an unused illustration asset. | Removed the unused import. |
| Supplier RFQ Details did not load an RFQ. | Added API call and loading/error handling. |
| My Quotations did not load supplier quotations. | Added API call and backend list endpoint. |
| Quotation Form only logged submitted data in the browser. | Connected it to the existing quotation create endpoint and redirects on success. |
| Available RFQs always showed zero items. | Added supplier RFQ listing endpoint and live page data. |
| Supplier Dashboard used hardcoded counts and empty previews. | Added live RFQ and quotation data, counts, previews, and deadlines. |
| Supplier API service file was missing. | Added a shared service file using the existing authenticated fetch client. |

## Files created

| File | Purpose |
| --- | --- |
| `Backend/app/routers/supplier_rfqs.py` | Supplier-only list and detail APIs for open RFQs. |
| `Backend/app/schemas/supplier_rfq.py` | Response models for supplier RFQs and supplier quotation lists. |
| `Backend/app/tests/test_supplier_workflow.py` | Isolated tests for supplier RFQ visibility, ownership, and quotation listing. |
| `frontend/src/services/supplierRFQService.js` | Frontend API functions for supplier RFQs and quotations. |
| `BUG_FIX.md` | This report. |

## Files modified

| File | Change |
| --- | --- |
| `Backend/app/main.py` | Registers the Supplier RFQ router under `/api`. |
| `Backend/app/routers/quotations.py` | Adds `GET /api/quotations`, returning only the authenticated supplier's quotations. |
| `frontend/src/pages/reports/Reports.jsx` | Removes unused asset import so lint passes. |
| `frontend/src/pages/supplier/AvailableRFQs.jsx` | Loads and displays open RFQs. |
| `frontend/src/pages/supplier/MyQuotations.jsx` | Loads and displays the supplier's quotations. |
| `frontend/src/pages/supplier/QuotationForm.jsx` | Submits quotations through the API and redirects after success. |
| `frontend/src/pages/supplier/SupplierDashboard.jsx` | Loads live dashboard counts, RFQ previews, quotation status, and deadlines. |
| `frontend/src/pages/supplier/SupplierRFQDetails.jsx` | Loads selected RFQ details through the API. |

## Backend endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/supplier/rfqs` | Authenticated Supplier | Lists currently open, unexpired RFQs. |
| `GET` | `/api/supplier/rfqs/{rfq_id}` | Authenticated Supplier | Returns one currently open, unexpired RFQ. |
| `GET` | `/api/quotations` | Authenticated Supplier with profile | Lists only that supplier's quotations with RFQ details. |
| `POST` | `/api/rfqs/{rfq_id}/quotations` | Existing authenticated Supplier endpoint | Creates a quotation. The frontend is now connected to it. |

## Request flow

```text
Supplier Dashboard / Available RFQs / RFQ Details / My Quotations / Quotation Form
↓
frontend/src/services/supplierRFQService.js
↓
frontend/src/services/fetchClient.js
  Existing JWT token and API base URL
↓
FastAPI supplier_rfqs.py or quotations.py
↓
Existing get_current_user authentication
↓
Supplier role and Supplier profile ownership checks
↓
RFQ, Quotation and Supplier SQLAlchemy models
↓
MySQL
```

## Security behavior

- The Supplier RFQ endpoints require a logged-in Supplier user.
- Buyers receive `403` from Supplier RFQ endpoints.
- Open RFQs can be browsed before a Supplier profile is saved, but `has_submitted` remains false because there is no supplier record yet.
- Quotation creation and quotation listing require a real Supplier profile.
- The quotation list filters by the Supplier record resolved from the authenticated user; no supplier ID comes from the frontend.
- Expired and closed RFQs are not returned through Supplier RFQ list/detail endpoints.

## Tests and checks performed

Passed:

```sh
# Frontend
npm run lint
npm run build

# Backend
venv/bin/python -m compileall -q app
venv/bin/python -m unittest discover -s app/tests -v
venv/bin/python -m pip check

# Repository check
git diff --check
```

Results:

- Frontend lint passed with no errors.
- Frontend production build passed.
- Backend compilation passed.
- Backend dependency check reported no broken requirements.
- All 12 backend tests passed.
- Git diff whitespace check passed.

The supplier workflow tests use an isolated SQLite database and do not touch the team's MySQL database.

## Remaining note

The test output still contains existing deprecation warnings for `datetime.utcnow()` and FastAPI's `HTTP_422_UNPROCESSABLE_ENTITY`. They do not fail the build or tests, but should be addressed later in a separate compatibility cleanup because they occur in shared existing backend code.

No commit, push, branch switch, reset, database reset, or migration was performed.
