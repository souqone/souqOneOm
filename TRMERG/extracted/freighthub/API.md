# FreightHub API Documentation

Base URL: `https://api.freighthub.om/api/v1`

Authentication: Bearer token in `Authorization` header for all protected endpoints.

---

## Transport Requests

### GET /transport/requests
Browse all transport requests with optional filters and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 12 | Items per page |
| serviceType | string | — | GOODS \| FURNITURE \| CONSTRUCTION \| HEAVY \| BACKLOAD \| EQUIPMENT |
| status | string | — | OPEN \| QUOTED \| ACCEPTED \| IN_PROGRESS \| COMPLETED \| CANCELLED \| EXPIRED |
| fromGovernorate | string | — | Filter by origin governorate |
| toGovernorate | string | — | Filter by destination governorate |
| sortBy | string | createdAt | createdAt \| budgetMax \| scheduledAt |
| sortOrder | string | desc | asc \| desc |

**Response:**
{
  "items": [ TransportRequest ],
  "meta": {
    "total": 247,
    "page": 1,
    "limit": 12,
    "totalPages": 21
  }
}

---

### POST /transport/requests
Create a new transport request. **Auth required.**

**Request Body:**
{
  "serviceType": "GOODS",
  "fromGovernorate": "مسقط",
  "fromCity": "السيب",
  "fromAddress": "المنطقة الصناعية، السيب",
  "toGovernorate": "صلالة",
  "toCity": "صلالة",
  "toAddress": "ميناء صلالة، المنطقة التجارية",
  "cargoDescription": "بضائع تجارية متنوعة",
  "weightTons": 5.0,
  "requiresHelper": false,
  "notes": "يرجى الحضور قبل الساعة 7 صباحاً",
  "scheduledAt": "2026-05-08T06:00:00Z",
  "isFlexible": true,
  "budgetMin": 500,
  "budgetMax": 800
}

**Response:** `TransportRequest` object

---

### GET /transport/requests/my
Get authenticated user's own requests. **Auth required.**

**Query Parameters:** `page`, `limit`

**Response:** `{ items: TransportRequest[], meta: PaginationMeta }`

---

### GET /transport/requests/:id
Get a single transport request by ID. Includes quotes and booking if they exist.

**Response:** `TransportRequest` with nested `quotes[]` and `booking`

---

### PATCH /transport/requests/:id/cancel
Cancel a transport request. **Auth required (owner only).**

**Response:** Updated `TransportRequest` with status `CANCELLED`

---

## Quotes

### POST /transport/requests/:id/quotes
Submit a quote for a transport request. **Auth required (carrier only).**

**Request Body:**
{
  "price": 650,
  "estimatedHours": 14,
  "message": "لدينا شاحنة مناسبة متاحة في الموعد المحدد."
}

**Validation:**
- `price`: required, number > 0
- `estimatedHours`: optional, number > 0
- `message`: optional, max 500 characters

**Response:** `TransportQuote` object

---

### GET /transport/requests/:id/quotes
Get all quotes for a request. **Auth required (request owner only).**

**Response:** `TransportQuote[]`

---

### PATCH /transport/quotes/:id/accept
Accept a quote, creating a booking. **Auth required (request owner only).**

**Response:** `TransportBooking` object

---

### PATCH /transport/quotes/:id/withdraw
Withdraw a submitted quote. **Auth required (quote owner only).**

**Response:** Updated `TransportQuote` with status `WITHDRAWN`

---

### GET /transport/quotes/my
Get authenticated carrier's submitted quotes. **Auth required.**

**Query Parameters:** `page`, `limit`

**Response:** `{ items: TransportQuote[], meta: PaginationMeta }`

---

## Bookings

### GET /transport/bookings/my
Get bookings for the authenticated user. **Auth required.**

**Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| role | string | shipper \| carrier |
| page | number | Page number |
| limit | number | Items per page |

**Response:** `{ items: TransportBooking[], meta: PaginationMeta }`

---

### PATCH /transport/bookings/:id/start
Mark a booking as in progress (loading started). **Auth required (carrier only).**

**Response:** Updated `TransportBooking` with status `IN_PROGRESS`

---

### PATCH /transport/bookings/:id/complete
Mark a booking as completed (delivery confirmed). **Auth required (shipper only).**

**Response:** Updated `TransportBooking` with status `COMPLETED` and `completedAt` timestamp

---

### PATCH /transport/bookings/:id/cancel
Cancel a booking. **Auth required (shipper or carrier).**

**Request Body:**
{
  "reason": "تغيير في خطط الشحن"
}

**Response:** Updated `TransportBooking` with status `CANCELLED`

---

## Carrier Profiles

### POST /transport/carrier-profile
Create a carrier profile for the authenticated user. **Auth required.**

**Request Body:**
{
  "companyName": "شركة الحارثي للنقل",
  "bio": "خبرة 10 سنوات في النقل بين المحافظات",
  "vehicleTypes": ["TRUCK_LARGE", "VAN"],
  "serviceTypes": ["GOODS", "FURNITURE"],
  "governorate": "مسقط",
  "city": "السيب",
  "contactPhone": "+968 9123 4567",
  "whatsapp": "+968 9123 4567"
}

**Validation:**
- `vehicleTypes`: required, min 1 item
- `serviceTypes`: required, min 1 item
- `governorate`: required

**Response:** `CarrierProfile` object

---

### GET /transport/carrier-profile/me
Get authenticated user's own carrier profile. **Auth required.**

**Response:** `CarrierProfile` object

---

### PATCH /transport/carrier-profile
Update carrier profile fields. **Auth required.**

**Request Body:** Partial `CarrierProfile` fields (same as POST)

**Response:** Updated `CarrierProfile`

---

### PATCH /transport/carrier-profile/availability
Toggle carrier availability status. **Auth required.**

**Request Body:**
{ "isAvailable": true }

**Response:** Updated `CarrierProfile` with new `isAvailable` value

---

### GET /transport/carriers
Browse all carrier profiles. Public endpoint.

**Query Parameters:**
| Parameter | Type | Description |
|---|---|---|
| page | number | Page number |
| limit | number | Items per page |
| governorate | string | Filter by governorate |
| vehicleType | string | Filter by vehicle type |
| serviceType | string | Filter by service type |
| isAvailable | boolean | Filter by availability |

**Response:** `{ items: CarrierProfile[], meta: PaginationMeta }`

---

### GET /transport/carriers/:id
Get a single carrier profile by ID. Public endpoint.

**Response:** `CarrierProfile` object

---

## Data Models

### TransportRequest
{
  id: string                    // "req-001"
  userId: string
  user: UserSummary
  serviceType: TransportServiceType
  status: RequestStatus
  fromGovernorate: string
  fromCity?: string
  fromAddress: string
  fromLat?: number
  fromLng?: number
  toGovernorate: string
  toCity?: string
  toAddress: string
  toLat?: number
  toLng?: number
  cargoDescription: string
  weightTons?: number
  requiresHelper: boolean
  notes?: string
  scheduledAt?: string          // ISO 8601
  isFlexible: boolean
  budgetMin?: number
  budgetMax?: number
  currency: string              // "OMR"
  viewCount: number
  expiresAt?: string
  _count: { quotes: number }
  quotes?: TransportQuote[]
  booking?: TransportBooking
  createdAt: string
  updatedAt: string
}

### TransportQuote
{
  id: string
  requestId: string
  request?: TransportRequest
  carrierId: string
  carrier?: CarrierProfile
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
  price: number
  currency: string
  estimatedHours?: number
  message?: string
  createdAt: string
}

### TransportBooking
{
  id: string
  requestId: string
  request?: TransportRequest
  quoteId: string
  quote?: TransportQuote
  status: 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  confirmedAt: string
  completedAt?: string
  cancelledAt?: string
  cancellationReason?: string
}

### CarrierProfile
{
  id: string
  userId: string
  user: UserSummary
  companyName?: string
  bio?: string
  vehicleTypes: VehicleType[]
  serviceTypes: TransportServiceType[]
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
  isAvailable: boolean
  isVerified: boolean
  completedTrips: number
  averageRating: number
  reviewCount: number
  createdAt: string
}

### Enums
type TransportServiceType = 'GOODS' | 'FURNITURE' | 'CONSTRUCTION' | 'HEAVY' | 'BACKLOAD' | 'EQUIPMENT'
type RequestStatus = 'OPEN' | 'QUOTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
type QuoteStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
type BookingStatus = 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type VehicleType = 'PICKUP' | 'VAN' | 'TRUCK_SMALL' | 'TRUCK_LARGE' | 'TRAILER' | 'EXCAVATOR' | 'TIPPER' | 'CRANE' | 'OTHER'

### UserSummary
{
  id: string
  username: string
  displayName: string
  avatarUrl: string
}

### PaginationMeta
{
  total: number
  page: number
  limit: number
  totalPages: number
}

---

## Error Responses

All errors follow this format:
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "Price must be greater than 0" }
  ]
}

| Status Code | Meaning |
|---|---|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — e.g. quote already submitted |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint Group | Limit |
|---|---|
| GET endpoints | 100 requests/minute |
| POST /transport/requests | 10 requests/hour per user |
| POST /transport/requests/:id/quotes | 20 requests/hour per carrier |
| Auth endpoints | 5 attempts/minute |