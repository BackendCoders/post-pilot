# Lead Generation API

This module provides CRUD APIs for leads and one bulk insert API.

Base path:

```text
/api/leads
```

All routes require authentication.

Required header:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Lead Fields

Stored fields in database:

- `user`: MongoDB ObjectId of the user
- `position`: number
- `title`: string
- `address`: string
- `latitude`: number
- `longitude`: number
- `rating`: number
- `ratingCount`: number
- `category`: string
- `googleMapUrl`: string
- `status`: `new | saved | contacted | converted | rejected`

## Routes

### 1. Create Lead

`POST /api/leads`

Sample request:

```json
{
  "user": "65f1234567890abcdef1234",
  "position": 1,
  "title": "Restaurant Owner",
  "address": "MG Road, Bengaluru",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "rating": 4.4,
  "ratingCount": 180,
  "category": "Restaurant",
  "googleMapUrl": "https://maps.google.com/example",
  "status": "new"
}
```

Notes:

- `user` is optional if the authenticated user should be used.
- Non-admin users can only create leads for themselves.
- `title` or `titile` is required.

### 2. List Leads

`GET /api/leads`

Supported query params:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `user`
- `status`

Example:

```text
GET /api/leads?page=1&limit=10&status=new
```

Notes:

- Admins can filter by `user`.
- Non-admin users only see their own leads.

### 3. Get Lead By Id

`GET /api/leads/:id`

Example:

```text
GET /api/leads/65f1234567890abcdef9999
```

### 4. Update Lead

`PATCH /api/leads/:id`

Sample request:

```json
{
  "status": "contacted",
  "rating": 4.8,
  "ratingCount": 220
}
```

Notes:

- You can update any stored lead field.
- Non-admin users can only update their own leads.

### 5. Delete Lead

`DELETE /api/leads/:id`

Notes:

- Non-admin users can only delete their own leads.

### 6. Bulk Create Leads

`POST /api/leads/bulk`

This route inserts many leads in one request for a given user.

Request body:

```json
{
  "user": "65f1234567890abcdef1234",
  "leads": [
    {
      "pos": 1,
      "titile": "Dentist",
      "address": "Brigade Road, Bengaluru",
      "lat": 12.9718,
      "lng": 77.6012,
      "rating": 4.6,
      "ratingcount": 340,
      "gmapurl": "https://maps.google.com/example-1"
    },
    {
      "pos": 2,
      "title": "Cafe Owner",
      "address": "Church Street, Bengaluru",
      "lat": 12.975,
      "lng": 77.605,
      "rating": 4.2,
      "ratingcount": 120,
      "gmapurl": "https://maps.google.com/example-2"
    }
  ]
}
```

Bulk route behavior:

- `status` is always saved as `new`
- `user` is taken from the top-level request body
- Each lead item supports both the API-friendly names and your incoming aliases:
  - `pos` or `position`
  - `title` or `titile`
  - `lat` or `latitude`
  - `lng` or `longitude`
  - `ratingcount` or `ratingCount`
  - `gmapurl` or `googleMapUrl`

## Success Response Shape

Typical success response:

```json
{
  "success": true,
  "data": {},
  "message": "Lead created successfully"
}
```

List response also includes pagination:

```json
{
  "success": true,
  "data": [],
  "message": "Leads fetched successfully",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Error Cases

Common errors:

- `400` validation failed
- `401` missing or invalid token
- `403` insufficient permissions
- `404` lead not found

## Suggested Test Order

1. Create one lead
2. List leads
3. Get created lead by id
4. Update the lead status
5. Bulk create leads
6. Delete one lead
