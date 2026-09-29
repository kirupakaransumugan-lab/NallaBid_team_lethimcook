# Supplier “My Catalogue” — implementation handover

This document covers the changes made in response to the Supplier “My Catalogue” implementation request. Paths below are relative to the project root: `NallaBid_Let_him_cook/NallaBid_team_lethimcook/`.

## 1. What was added

Suppliers now have a **My Catalogue** navigation item and page at `/supplier/catalogue` containing:

- A header and **Import CSV** action.
- Total Products and Total Available Quantity cards calculated from API data.
- A table showing product name, description, unit price and available quantity.
- A CSV upload form with filename preview, Cancel and Import Catalogue buttons.
- Loading, empty, success, validation-error and request-error states.
- Automatic catalogue reload after a successful import.
- A Profile link when the supplier has not completed their profile.
- A horizontally scrollable table for smaller screens and keyboard-accessible controls.

No mock catalogue data, hardcoded supplier IDs or hardcoded tokens were added.

## 2. What already existed and was reused

| Existing file | What the feature reuses |
| --- | --- |
| [Backend/app/models/supplier_catalogue.py](Backend/app/models/supplier_catalogue.py) | SQLAlchemy catalogue model and existing `supplier_catalogues` table. |
| [Backend/app/models/supplier.py](Backend/app/models/supplier.py) | Supplier-to-user relationship used to establish ownership. |
| [Backend/app/schemas/supplier.py](Backend/app/schemas/supplier.py) | Existing `SupplierCatalogueResponse` Pydantic schema. |
| [Backend/app/security/auth.py](Backend/app/security/auth.py) | `get_current_user`, JWT validation and active-user checks. |
| [Backend/app/database.py](Backend/app/database.py) | `get_db`, SQLAlchemy session and MySQL connection configuration. |
| [Backend/app/main.py](Backend/app/main.py) | Existing registration of suppliers and imports routers. No new router registration was necessary. |
| [Backend/app/services/profile_service.py](Backend/app/services/profile_service.py) | Existing workflow that creates a Supplier record when Profile is saved. |
| [frontend/src/services/authService.js](frontend/src/services/authService.js) | API base URL, token retrieval, logout handling and existing error handling. |
| [frontend/src/utils/format.js](frontend/src/utils/format.js) | `formatLKR` for the existing currency display convention. |
| [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx) | Existing supplier sidebar, navbar and responsive layout. |
| [frontend/src/pages/supplier/supplier.css](frontend/src/pages/supplier/supplier.css) | Supplier colors, cards, typography, spacing, buttons and responsive conventions. |

The existing CSV upload endpoint was extended, not duplicated. No supplier-owned catalogue listing endpoint existed, so one was added to the existing suppliers router.

## 3. Files created and why

| New file | Why it was created | Connected files |
| --- | --- | --- |
| [frontend/src/pages/supplier/SupplierCatalogue.jsx](frontend/src/pages/supplier/SupplierCatalogue.jsx) | Implements the catalogue page, summaries, table, upload form and UI states. | Imported by `App.jsx`; imports `catalogueService.js`, `utils/format.js` and `supplier.css`; links to `/supplier/profile`. |
| [frontend/src/services/catalogueService.js](frontend/src/services/catalogueService.js) | Keeps catalogue API paths and upload request construction out of React components. | Called by `SupplierCatalogue.jsx`; imports `apiRequest` from `fetchClient.js`. |
| [Backend/app/services/supplier_service.py](Backend/app/services/supplier_service.py) | Provides a shared `require_supplier_profile` dependency for the two catalogue operations, avoiding duplicate ownership/profile checks. | Used by `routers/suppliers.py` and `routers/imports.py`; uses `security/auth.py`, `database.py` and `models/supplier.py`. |
| [Backend/app/tests/test_catalogue.py](Backend/app/tests/test_catalogue.py) | Checks import correctness, supplier isolation, validation, duplicate behavior and rollback without using the team's database. | Exercises catalogue routers, supplier dependency and CSV service using an isolated SQLite database. |
| [MY_CATALOGUE_IMPLEMENTATION.md](MY_CATALOGUE_IMPLEMENTATION.md) | This handover document, created in response to the follow-up documentation request. | Documentation only; not imported by the application. |

The implementation created four application/test files. This document is an additional documentation file.

## 4. Existing files modified

| Modified file | Exact purpose of the change |
| --- | --- |
| [frontend/src/App.jsx](frontend/src/App.jsx) | Imports `SupplierCatalogue` and adds `/supplier/catalogue`, wrapped in existing `RequireRole role="SUPPLIER"` and `Navbar`. |
| [frontend/src/components/Navbar.jsx](frontend/src/components/Navbar.jsx) | Adds **My Catalogue** to `supplierMenuItems`, pointing to `/supplier/catalogue`. Existing items remain. |
| [frontend/src/services/fetchClient.js](frontend/src/services/fetchClient.js) | Lets `apiRequest` send `FormData` without JSON conversion or manually setting multipart Content-Type. Also formats structured CSV errors into readable row-specific messages. Existing JSON requests retain their behavior. |
| [frontend/src/pages/supplier/supplier.css](frontend/src/pages/supplier/supplier.css) | Adds styles scoped to `.supplierCatalogue` for import form, table, summaries, messages and responsive behavior. |
| [Backend/app/routers/suppliers.py](Backend/app/routers/suppliers.py) | Adds authenticated `GET /api/suppliers/me/catalogue`, using the existing response schema and filtering by the authenticated supplier's ID. |
| [Backend/app/routers/imports.py](Backend/app/routers/imports.py) | Reuses the shared supplier-profile dependency; preserves the existing upload URL and CSV restriction; reads at most the existing 2 MiB limit plus one byte to detect oversized files. |
| [Backend/app/services/csv_service.py](Backend/app/services/csv_service.py) | Replaces unconditional inserts with validated, transactional create/update behavior; adds deterministic duplicate handling and stronger malformed/numeric/empty-file validation. |

## 5. Navigation connections

```text
frontend/src/components/Navbar.jsx
  supplierMenuItems → “My Catalogue” → /supplier/catalogue
      ↓
frontend/src/App.jsx
  RequireRole(SUPPLIER)
      ↓
  Navbar layout
      ↓
frontend/src/pages/supplier/SupplierCatalogue.jsx
```

If the Supplier database row is missing:

```text
SupplierCatalogue.jsx
  → “Complete your supplier profile…” message
  → /supplier/profile
  → existing App.jsx Profile route
  → existing frontend/src/pages/Profile.jsx
  → existing profile service/API workflow
  → Supplier row created when the user saves real profile details
```

The catalogue feature does not create fake company records or change registration.

## 6. Loading catalogue data: complete connection path

```text
SupplierCatalogue.jsx
  getMyCatalogue()
      ↓
frontend/src/services/catalogueService.js
  apiRequest("/suppliers/me/catalogue")
      ↓
frontend/src/services/fetchClient.js
  existing API_URL + path
  Authorization: Bearer <existing logged-in user's token>
      ↓
GET /api/suppliers/me/catalogue
      ↓
Backend/app/main.py
  existing suppliers.router registration
      ↓
Backend/app/routers/suppliers.py
  get_my_catalogue()
      ├─ supplier_service.py → require_supplier_profile()
      │    ├─ security/auth.py → get_current_user()
      │    └─ models/supplier.py → lookup by authenticated user ID
      └─ database.py → get_db()
      ↓
models/supplier_catalogue.py
  SELECT where supplier_id == authenticated supplier.id
      ↓
MySQL: supplier_catalogues
      ↓
schemas/supplier.py → SupplierCatalogueResponse list
      ↓
JSON response → catalogueService.js → SupplierCatalogue.jsx
      ↓
Table and calculated summary cards
```

Only this supplier's records are returned. Records are sorted by product name and ID.

## 7. Importing CSV: complete connection path

```text
SupplierCatalogue.jsx
  user chooses file → handleImport() → importCatalogue(file)
      ↓
frontend/src/services/catalogueService.js
  FormData: field name “file”
  apiRequest("/imports/supplier-catalogue", { method: "POST", body })
      ↓
frontend/src/services/fetchClient.js
  attaches existing JWT; browser supplies multipart boundary
      ↓
POST /api/imports/supplier-catalogue
      ↓
Backend/app/main.py → existing imports.router registration
      ↓
Backend/app/routers/imports.py
  require_supplier_profile() + extension/size checks
      ↓
Backend/app/services/csv_service.py
  import_supplier_catalogue(content, authenticated supplier.id, db)
      ↓
Validate the whole CSV before changing data
      ↓
Lock Supplier row; load and lock this supplier's catalogue records
      ↓
Create new products / update matching products
      ↓
SupplierCatalogue SQLAlchemy model → MySQL transaction
      ↓
Commit all changes, or roll back on database failure
      ↓
Result counts → success message in SupplierCatalogue.jsx
      ↓
Automatically call getMyCatalogue() again → refreshed table/cards
```

The frontend never supplies an ownership ID. The backend passes the authenticated supplier ID to the CSV service.

## 8. Duplicate-import behavior and evaluation connection

The current model has no SKU or product-code field. Existing evaluation logic in [Backend/app/services/evaluation_service.py](Backend/app/services/evaluation_service.py), `find_available_quantity`, matches by supplier and trimmed, case-insensitive product name. The import uses that existing convention; evaluation code was not modified.

Rules:

1. A new normalized product name creates a catalogue row.
2. An existing normalized product name updates product name, description, price and quantity.
3. Reimporting the same CSV does not add more rows for those products.
4. Multiple rows with the same normalized name inside one CSV are rejected before writing.
5. If historical duplicate database rows already exist, all matching copies are updated consistently. None are deleted.
6. Products absent from the uploaded CSV are kept.
7. Imports for one supplier lock that Supplier row to serialize this import path, including when their catalogue is empty.

Successful results include:

- `imported`: distinct products processed.
- `created`: new products inserted.
- `updated`: existing product groups updated, including unchanged values on repeat import.
- `duplicate_rows_updated`: additional historical duplicate copies updated.
- `errors`: empty on success.

Summary cards count distinct normalized product names. Quantity uses the highest recorded stock per product, matching the current evaluation rule rather than adding duplicate copies together. If a product has no recorded quantity, the overall quantity displays “Not available”. The table still shows every retained record.

## 9. Authentication and access protection

- Existing JWT/current-user authentication remains in use.
- The shared dependency rejects non-suppliers with `403`.
- Missing Supplier profiles return `404` with a profile-completion message.
- List and import operations derive ownership from `Supplier.user_id == current_user.id`.
- The listing query filters by that Supplier row's ID.
- The import only reads/updates catalogue records for that supplier.
- Existing buyer catalogue visibility was not changed.

The frontend role guard improves navigation; backend checks enforce the actual access boundary.

## 10. CSV format and validation

```csv
product_name,description,unit_price,available_quantity
A4 Paper,"White paper, 500 sheets",1250.00,100
Office Chair,Adjustable chair,18500.00,25
```

| Field/rule | Requirement |
| --- | --- |
| Encoding | UTF-8; UTF-8 BOM accepted. |
| File | `.csv`, maximum 2 MiB. |
| Headers | All four shown above are required. Header names are trimmed; empty/duplicate header names are rejected. |
| Product name | Trimmed, 1–150 characters; unique within the CSV after case-insensitive normalization. |
| Description | Column required; value may be blank. Maximum 65,535 UTF-8 bytes. |
| Unit price | Finite non-negative number, maximum 9,999,999,999.99; at most two decimal places in value. |
| Available quantity | Integer from 0 through 2,147,483,647. |
| Rows | Must have the same number of fields as the header. Quote descriptions containing commas. |
| Empty input | Empty files and files with only headers are rejected. |
| Malformed data | Invalid CSV quoting, null characters, invalid numeric values and invalid encoding are rejected. |

Validation errors include a row/line number where available. The frontend renders these messages rather than replacing them with a generic upload error. Any validation error prevents the entire import from being written.

## 11. Verification performed

Passed during implementation:

- Seven backend tests covering repeat import, ownership isolation, legacy duplicate preservation, validation atomicity, BOM/header handling, rollback, role/profile checks and upload limits.
- Frontend production build.
- ESLint on changed JavaScript/JSX files.
- `git diff --check`.

Backend test command, from `Backend/`:

```sh
venv/bin/python -m unittest app.tests.test_catalogue -v
```

Frontend commands, from `frontend/`:

```sh
npm run build
npx eslint src/pages/supplier/SupplierCatalogue.jsx src/services/catalogueService.js src/services/fetchClient.js src/App.jsx src/components/Navbar.jsx
```

These backend tests use SQLite and exercise the router/service functions. They do not constitute full live JWT-over-HTTP or MySQL concurrency verification.

## 12. Manual testing for the team

### Swagger

1. Start the backend using the team's normal setup and open `/docs`.
2. Authorize with supplier credentials; ensure the supplier has saved their Profile.
3. Execute `GET /api/suppliers/me/catalogue`.
4. Execute `POST /api/imports/supplier-catalogue`, choosing a CSV in the `file` field.
5. GET the catalogue again and verify the rows.
6. Upload the same file again: verify zero new products and updated existing products.
7. Upload invalid CSV data: verify an understandable error and no partial writes.
8. Try another supplier: verify isolation. Try a buyer: expect `403`. Try without authentication: expect authentication rejection.
9. Try a supplier without a Supplier row: expect `404` and the profile-completion message.

### Frontend

1. Log in as a supplier and click **My Catalogue**.
2. Verify the table or empty state, then click **Import CSV**.
3. Select a valid CSV and verify its filename is shown.
4. Click **Import Catalogue** and verify success plus automatic table/card refresh.
5. Repeat the import and confirm the product count does not increase.
6. Try Cancel, invalid file type, oversized file, invalid values and a network error.
7. Verify the Profile link for an incomplete supplier profile.
8. Check keyboard navigation and mobile table scrolling/sidebar behavior.

## 13. Limitations and scope

- Live browser testing and live MySQL concurrency testing were not performed.
- Historical duplicate records remain intentionally; this feature does not delete or merge them.
- Duplicate identity follows the current product-name convention, not a database uniqueness constraint. Writers outside this import path are not covered by its supplier-row lock.
- No manual add/edit/delete product interface was requested or added; updates happen through CSV import.
- Existing evaluation matching remains unchanged, including its current product-name matching assumptions.
- No models, database tables or migrations were changed. No database reset or live-data cleanup was performed.
- No unrelated Buyer, RFQ, quotation, evaluation, award, report, registration or login implementation was changed.
- No git commit, push, branch switch or reset was performed.
