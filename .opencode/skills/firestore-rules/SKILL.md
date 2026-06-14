---
name: firestore-rules
description: Use when adding, removing, or modifying Firestore collections in the codebase. Ensures firestore.rules stays in sync with the collections used in API routes, hooks, and repositories.
---

# Firestore Rules Sync

Whenever a new Firestore collection is referenced in the codebase (API routes, hooks, repositories, etc.), update `firestore.rules` to include appropriate security rules for that collection.

## Rules pattern by collection type

### Public read, authenticated write
Use for catalog data (products, categories, condiments, flavors, neighborhoods, cities, deliveryCosts, storeCitySettings, promotions, promotionEvents):
```
match /{collection}/{docId} {
  allow read: if true;
  allow write: if isAuth();
}
```

### Authenticated read/write
Use for orders:
```
match /orders/{orderId} {
  allow read: if true;
  allow create: if isAuth();
  allow update, delete: if isAuth();
}
```

### Owner/admin only write (store-scoped)
Use for store-scoped data where only the store owner/admin can modify:
```
match /{collection}/{docId} {
  allow read: if isAuth();
  allow create: if isAuth() && isStoreAdmin(request.resource.data.storeId);
  allow update, delete: if isAuth() && resource.data.storeId != null && isStoreAdmin(resource.data.storeId);
}
```

### Server-side only (Admin SDK)
Use for audit logs and sensitive data that only the backend should write:
```
match /{collection}/{docId} {
  allow read: if isAuth();
  allow write: if false;
}
```

### Global settings (owner/admin only)
Use for platform-wide settings:
```
match /settings/{settingId} {
  allow read: if isAuth();
  allow write: if isAuth() && (request.auth.token.role == "owner" || request.auth.token.role == "admin");
}
```

## Existing helper functions

- `isAuth()` — checks `request.auth != null`
- `isOwner(companyId)` — true if user has `role == "owner"` or `"admin"` in auth token, OR is the company's `ownerId`
- `isStoreAdmin(companyId)` — true if `isOwner(companyId)` OR user's UID is in `adminIds` array of the company document

## Current collections and their rules in firestore.rules

| Collection | Read | Write | Rule |
|---|---|---|---|
| categories | public | auth | public/authenticated |
| products | public | auth | public/authenticated |
| condiments | public | auth | public/authenticated |
| flavors | public | auth | public/authenticated |
| neighborhoods | public | auth | public/authenticated |
| cities | public | auth | public/authenticated |
| orders | public | auth | public/authenticated |
| deliveryCosts | public | auth | public/authenticated |
| storeCitySettings | public | auth | public/authenticated |
| promotionEvents | public | auth | public/authenticated |
| promotions | public | auth | public/authenticated |
| companies | public | owner/admin | owner/admin write |
| users | auth | self/storeAdmin | self/admin write |
| notifications | auth | auth/userId | scoped write |
| order_reviews | auth | auth | general auth |
| addresses | auth | self | self only |
| commission_audit_log | owner | auth/deny | server-side + owner read |
| coupons | auth | isStoreAdmin | store-admin write |
| coupon_usage | auth | deny | server-side only |
| settings | auth | owner/admin | owner/admin write |
| mercadopago_oauth_states | deny | deny | server-side only |
