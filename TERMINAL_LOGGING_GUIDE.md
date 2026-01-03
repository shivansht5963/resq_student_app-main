# Terminal Logging Guide - Image Upload Process

## Overview
Comprehensive terminal logging has been added throughout the image upload workflow to provide detailed visibility into the process. All logs use emoji prefixes for easy visual scanning.

---

## 📸 Image Selection Logs

### Camera Image Capture
When user taps "Take Photo":
```
🎥 Image picker started - Mode: camera
📷 Launching camera...
✅ Camera image captured: file:///data/user/0/com/.../image.jpg
📊 Current images count: 1 / 3
✅ Image added to list. Total: 1
```

### Gallery Image Selection
When user taps "Pick from Gallery":
```
🎥 Image picker started - Mode: gallery
🖼️ Launching image library...
✅ Images selected from library: 2
📊 Total images will be: 3 / 3
🔗 Selected URIs: [array of image URIs]
✅ All images added to list. Total: 3
```

### Image Removal
When user taps delete on an image:
```
🗑️ Image removed: file:///data/user/0/com/.../image.jpg
📊 Remaining images: 2
```

---

## 🚀 Form Submission Logs

### Submission Start
```
======================================================================
🚀 INCIDENT REPORT SUBMISSION STARTED
======================================================================
📋 Report Details: {
  type: "security",
  description: "Suspicious person near dormitory...",
  location: null,
  beaconId: "beacon_uuid_123",
  beaconName: "Dorm A - Entrance",
  imageCount: 2,
  timestamp: "2024-12-15T10:30:45.123Z"
}
🖼️ Images to upload: 2
   [Image 1] ...final_demo/create-anything/_/apps/mobile/cache/image1.jpg
   [Image 2] ...final_demo/create-anything/_/apps/mobile/cache/image2.jpg
```

---

## 📡 FormData Building & Image Processing

### FormData Field Logs
```
  ✅ beacon_id added: beacon_uuid_123
  ✅ type added: security
  ✅ description added: "Suspicious person near dormitory..."
  ✅ location added: (skipped if not provided)
```

### Image Blob Conversion (Per Image)
```
📸 Processing images...
  Total images to process: 2

  [Image 1/2]
    URI: ...final_demo/create-anything/_/apps/mobile/cache/image1.jpg
    Filename: image1.jpg
    🔄 Fetching as blob...
    ✅ Blob created - Size: 245.67 KB, Type: image/jpeg
    ✅ Appended to FormData as "images"

  [Image 2/2]
    URI: ...final_demo/create-anything/_/apps/mobile/cache/image2.jpg
    Filename: image2.jpg
    🔄 Fetching as blob...
    ✅ Blob created - Size: 189.45 KB, Type: image/jpeg
    ✅ Appended to FormData as "images"

✅ All images processed and added to FormData
```

---

## 📤 HTTP Request/Response Logs

### Request Details
```
📡 Sending POST request...
  Endpoint: https://resq-server.onrender.com/api/incidents/report/
  Headers: {
    Accept: "application/json",
    Authorization: "Token [REDACTED]"
  }
  Content-Type: multipart/form-data (auto-set by React Native)
```

### Response Received
```
📥 Response received
  Status: 201 Created
  Content-Type: application/json; charset=utf-8
📊 Response data: {
  incident_id: "ab123cd4-5678-90ef-ghij-klmnopqrstuv",
  status: "incident_created",
  images_count: 2
}
```

### Success Summary
```
✅ INCIDENT REPORT SUBMISSION SUCCESSFUL
Status: incident_created
Incident ID: ab123cd4
📸 Images uploaded: 2
   [1] https://resq-server.onrender.com/media/incidents/image1_abc123.jpg
   [2] https://resq-server.onrender.com/media/incidents/image2_def456.jpg
======================================================================
```

---

## 🔴 Error Logs

### Image Loading Error (Non-Fatal)
```
⚠️ Warning: Could not load all images, continuing without them
Error details: [Network error or file not found]
```

### Validation Error
```
Report incident error: {
  status: 400,
  message: "Invalid request. Please check your input.",
  type: "BAD_REQUEST",
  detail: { beacon_id: ["This field is required."] }
}
```

### Network Error
```
Report incident error: {
  status: 0,
  message: "Network error. Please check your connection.",
  type: "NETWORK_ERROR",
  detail: "Network request failed"
}
```

### Authorization Error
```
❌ Error 401: Unauthorized
  Detail: Invalid or missing token
```

---

## 🛠️ How to Use These Logs

### 1. **Monitor in Terminal**
```bash
npx expo start --dev-client
# Logs appear in real-time as user interacts with app
```

### 2. **Filter by Process**
- **Image Selection**: Look for 🎥📷🖼️ emoji prefix
- **FormData Building**: Look for ✅ emoji followed by "added"
- **Image Processing**: Look for 📸 and blob info
- **HTTP Request**: Look for 📡 and endpoint
- **Response**: Look for 📥 and status code
- **Success**: Look for ✅ INCIDENT REPORT SUBMISSION SUCCESSFUL

### 3. **Debug Image Count Issues**
- Check "📊 Current images count" logs to see if max limit is enforced
- Check "Total images will be" to see final count before submission
- Check image blob sizes to ensure valid image files

### 4. **Debug Upload Failures**
1. Check if "✅ Appended to FormData as images" appears for each image
2. Check HTTP response status code (should be 201 for success)
3. Check error detail for backend validation messages
4. Check network error logs if status 0

### 5. **Performance Monitoring**
- Note blob sizes for each image
- Total KB = sum of all blob sizes
- If upload is slow, check blob sizes (max recommended: 5MB per image)

---

## 🔍 Common Issues & What to Look For

| Issue | Log Indicators |
|-------|---|
| Images not being added | No "✅ Image added to list" after picker closes |
| Max limit error | "❌ Max images reached: 3" appears |
| Blob conversion fails | "⚠️ Could not load all images" appears |
| FormData not building | Missing "✅ [field] added" logs |
| Upload fails | "📥 Response received" shows status ≠ 201 |
| Auth problem | "Error 401" or "Authorization: Token [REDACTED]" wrong |
| Network issue | "Error 0: Network error" appears |
| Server error | "Error 500: Server Error" appears |

---

## 📊 Log Data Dictionary

| Term | Meaning |
|------|---------|
| `🎥` | Image picker initialization |
| `📷` | Camera action |
| `🖼️` | Gallery/library action |
| `✅` | Success/completion |
| `❌` | Error/failure |
| `📊` | Statistics/count info |
| `📸` | Image-related processing |
| `📡` | HTTP request sending |
| `📥` | HTTP response receiving |
| `🗑️` | Deletion action |
| `⚠️` | Warning (non-fatal) |
| `🔄` | Processing in progress |

---

## 🔗 Implementation Files

- **Image Selection & Submission**: [src/app/report.jsx](src/app/report.jsx) (lines 136-271)
- **FormData & Image Processing**: [src/utils/api.js](src/utils/api.js#L279-L340) (`reportIncident` function)
- **HTTP Request/Response**: [src/utils/api.js](src/utils/api.js#L342-L370)

---

## ✨ Next Steps

1. Run app with `npx expo start --dev-client`
2. Navigate to Report Incident screen
3. Select 1-3 images using camera or gallery
4. Fill in incident details
5. Tap "Submit Report"
6. Monitor terminal output - should see full progression of logs above
7. Check Network tab (if using web) to verify request body is multipart/form-data

All images should be converted to Blobs and appended to FormData correctly, resulting in a successful 201 response from backend.
