# API Contract: Sign Upload

## POST /api/media/sign-upload

Generates a time-limited cryptographic signed upload URL for direct client-to-Supabase upload.

### Request

**Endpoint**: `POST /api/media/sign-upload`

**Content-Type**: `application/json`

**Body**:
```json
{
  "filename": "uuid.webp",
  "contentType": "image/webp"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `filename` | `string` | Yes | Target filename with extension (must be .webp, .jpg, .jpeg, .png, or .gif) |
| `contentType` | `string` | Yes | MIME type of the file being uploaded |

### Response

**Status**: `200 OK`

```json
{
  "signedUrl": "https://<project>.supabase.co/storage/v1/object/sign/talago-tour-media/tours/<uuid>.webp?token=<jwt>&expires=60",
  "path": "tours/<uuid>.webp",
  "token": "<jwt-token>",
  "publicUrl": "https://<project>.supabase.co/storage/v1/object/public/talago-tour-media/tours/<uuid>.webp"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `signedUrl` | `string` | Temporary signed URL valid for 60 seconds for PUT upload |
| `path` | `string` | Storage path within the bucket |
| `token` | `string` | Security token for the signed URL |
| `publicUrl` | `string` | Public URL of the file once uploaded |

### Error Responses

**Status**: `400 Bad Request`

```json
{
  "error": "Missing filename or contentType"
}
```

```json
{
  "error": "Invalid file extension"
}
```

**Status**: `500 Internal Server Error`

```json
{
  "error": "Failed to generate signed upload URL"
}
```

### Client Usage

```
PUT <signedUrl>
Content-Type: image/webp
Body: <binary WebP blob>

→ 200 OK (on success)
```

The client uploads the compressed WebP binary directly to the `signedUrl` using `XMLHttpRequest` with `Content-Type: image/webp`. Progress is tracked via `xhr.upload.onprogress`.

### Security

- Service role key is used server-side to generate signed URLs — never exposed to the client
- Signed URL is valid for 60 seconds from generation
- File extension is validated against an allowlist on the server
- The storage bucket (`talago-tour-media`) should have public read access enabled for the public URL to work, but write access restricted to signed URLs only

### Dependencies

- Environment: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Bucket: `talago-tour-media` must exist in Supabase Storage
- Supabase client initialized with service role permissions
