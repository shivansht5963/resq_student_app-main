# Image + Report Upload Flow - With 5 Critical Fixes

## The 5 Backend-Recommended Fixes

### 1️⃣ **Remove Content-Type Header** ❌ DON'T SET MANUALLY
```javascript
// ❌ WRONG - Breaks request
headers: { 'Content-Type': 'multipart/form-data' }

// ✅ CORRECT - FormData auto-sets with boundary
headers: { 'Authorization': `Token ${token}` }
// FormData handles Content-Type automatically
```
**Why:** Manual header missing boundary → backend can't parse

---

### 2️⃣ **Add Filename to Blob**
```javascript
// ❌ WRONG
formData.append('images', blob);

// ✅ CORRECT
formData.append('images', blob, 'photo-1.jpg');
//                              ↑ Must include filename
```
**Why:** Backend needs filename to save with proper extension

---

### 3️⃣ **Convert File URIs → Blobs** (React Native)
```javascript
// React Native gives: file:///storage/cache/image.jpg
// Must convert to Blob first

async function fileUriToBlob(fileUri) {
  const response = await fetch(fileUri);
  let blob;
  try {
    blob = await response.blob();
  } catch {
    // Fallback for ArrayBuffer issue
    const arrayBuffer = await response.arrayBuffer();
    blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
  }
  return blob;
}

// Use:
for (let uri of imageUris) {
  const blob = await fileUriToBlob(uri);
  formData.append('images', blob, `image-${Date.now()}.jpg`);
}
```

---

### 4️⃣ **Add 30s Timeout**
```javascript
async function uploadWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout - too slow');
    }
    throw error;
  }
}

// Use in upload:
const response = await uploadWithTimeout(url, options, 30000);
```
**Why:** Prevent hanging requests, show user meaningful error

---

### 5️⃣ **Validate Before Upload**
```javascript
function validateIncidentReport(data) {
  const { type, description, imageUris, beaconId, location } = data;

  if (!type?.trim()) throw new Error('Type required');
  if (!description?.trim()) throw new Error('Description required');
  if (!beaconId && !location) throw new Error('Beacon/Location required');
  if (imageUris.length === 0) throw new Error('Select ≥1 image');
  if (imageUris.length > 3) throw new Error('Max 3 images');

  return true;
}

// Use before upload
try {
  validateIncidentReport(data);
  // Proceed
} catch (error) {
  Alert.alert('Error', error.message);
}
```
**Why:** Fail fast, better UX, save bandwidth

---

## Complete Upload Flow

```
1️⃣ User selects images + form → imageUris: [file:///, file:///]

2️⃣ Call reportIncident(data)

3️⃣ Validate(data) 
   ❌ If missing fields → Show error, stop

4️⃣ Build FormData
   - Add text fields (type, description, beacon_id/location)
   - ✅ DO NOT set Content-Type header
   
5️⃣ Convert each image
   - file:/// URI → fetch → Blob
   - Handle ArrayBuffer fallback
   - ✅ ADD FILENAME: formData.append('images', blob, 'photo.jpg')
   
6️⃣ Send POST with timeout
   - ✅ 30-second timeout with AbortController
   - Headers: { Authorization: Token ... } (no Content-Type)
   - Body: FormData
   
7️⃣ Response 201
   ✅ Incident ID + image URLs
   
8️⃣ Show success
   ✅ "Incident created"
```

---

## Current Issues → Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Images count = 0 | Blob conversion fails | Use arrayBuffer fallback |
| 400 Bad Request | Missing boundary in multipart | Remove Content-Type header |
| No filename | Just Blob, no name | Add 3rd param to append() |
| Hangs 60s+ | No timeout | Add AbortController |
| Invalid data uploaded | No validation | Check before upload |

---

## Implementation Checklist

- [ ] FormData does NOT manually set Content-Type
- [ ] All appends include filename: `append('images', blob, name)`
- [ ] Use fileUriToBlob() with arrayBuffer fallback
- [ ] Upload wrapped with 30-second timeout
- [ ] validateIncidentReport() called before upload
- [ ] Error handling shows user-friendly message
- [ ] Token in Authorization header
- [ ] Max 3 images enforced in validation
- [ ] beacon_id OR location required in validation

✅ All 9 checks → Upload works perfectly!
