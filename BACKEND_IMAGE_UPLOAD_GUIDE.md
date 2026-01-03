# Backend Image Upload - Quick Troubleshooting Guide

## What Frontend Sends ✅
```
POST /incidents/report/
Content-Type: multipart/form-data; boundary=...
Authorization: Token {token}

Fields:
- beacon_id (string)
- type (string)
- description (string)
- location (string)
- images (file/blob array - up to 3)
```

## Backend Django Checklist

### 1. ✅ Handle multipart/form-data
```python
# Make sure view accepts multipart
def report(request):
    if request.method == 'POST':
        # Django auto-parses multipart
        files = request.FILES.getlist('images')
        data = request.POST
```

### 2. ✅ Check field names match
- Frontend sends: `images` → Backend expects: `request.FILES['images']`
- Not `image`, `file`, `photo` - must be `images`

### 3. ✅ Verify serializer
```python
class IncidentSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True
    )
```

### 4. ✅ Handle in create()
```python
def create(self, validated_data):
    images = validated_data.pop('images', [])
    incident = Incident.objects.create(**validated_data)
    
    for image in images:
        IncidentImage.objects.create(incident=incident, image=image)
    
    return incident
```

### 5. ✅ Check middleware
- Ensure `django.middleware.csrf.CsrfViewMiddleware` is enabled
- CSRF token might be needed (check if frontend sends it)

### 6. ✅ Test with curl
```bash
curl -X POST http://localhost:8000/api/incidents/report/ \
  -H "Authorization: Token {token}" \
  -F "beacon_id=safe:uuid:403:403" \
  -F "type=Safety Concern" \
  -F "description=Test" \
  -F "location=Test" \
  -F "images=@/path/to/image.jpg"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| 400 Bad Request | Check field names match exactly (`images` not `image`) |
| 413 Payload Too Large | Increase `DATA_UPLOAD_MAX_MEMORY_SIZE` in Django settings |
| Files not received | Verify `request.FILES` is being parsed |
| 415 Unsupported Media Type | Don't validate Content-Type manually - let Django handle it |
| Empty images list | Check frontend is appending to `images` key, not `image` |

## Django Settings (if needed)
```python
# settings.py
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760
APPEND_SLASH = True
```

## Summary
✅ Frontend sends correct multipart/form-data  
⚠️ Backend must accept `request.FILES['images']`  
⚠️ Serializer must have `images = ListField(FileField())`  
⚠️ View must save images in create() method  

**Most likely issue:** Serializer doesn't handle `images` field or view doesn't save them.
