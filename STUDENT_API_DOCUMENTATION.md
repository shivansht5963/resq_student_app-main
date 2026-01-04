## 📚 STUDENT API DOCUMENTATION

### Overview
This guide explains all the APIs available for students in the ERP system. Students can view their personal information, attendance, marks, fees, and notifications.

---

## 🔐 Authentication

**All endpoints require authentication** (except login).

**Header Format:**
```
Authorization: Token <auth_token>
```

**Get Token:**
```http
POST https://erp-9pbn.onrender.com/api/v1/auth/login/
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "auth_token": "9944b09199c62bcf9418ad846dd0e4bbea6f7f7f",
  "user_id": 1,
  "email": "student@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "message": "Login successful"
}
```

---

## 🎓 STUDENT ENDPOINTS (6 APIs)

### 1. LIST ALL STUDENTS
**Request Type:** GET  
**Endpoint:** `/students/`  
**Authentication:** Required ✅  
**Purpose:** View all students in the system (admin/faculty use)

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "roll_number": "CS001",
    "course": 1,
    "course_name": "Bachelor of Computer Science",
    "class_enrolled": 1,
    "semester": 1,
    "dob": "2005-01-15",
    "contact_number": "9876543210",
    "address": "123 Main Street, City",
    "category": "GENERAL",
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "student@example.com",
      "phone": "9876543210",
      "dob": "2005-01-15",
      "role": "student"
    }
  },
  {
    "id": 2,
    "roll_number": "CS002",
    "course": 1,
    "course_name": "Bachelor of Computer Science",
    "class_enrolled": 1,
    "semester": 1,
    "dob": "2005-02-20",
    "contact_number": "9876543211",
    "address": "456 Oak Avenue, City",
    "category": "SC/ST",
    "user": {
      "id": 2,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com",
      "phone": "9876543211",
      "dob": "2005-02-20",
      "role": "student"
    }
  }
]
```

---

### 2. GET STUDENT DETAILS
**Request Type:** GET  
**Endpoint:** `/students/{id}/`  
**Authentication:** Required ✅  
**Purpose:** View a specific student's complete profile

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/1/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": 1,
  "roll_number": "CS001",
  "course": 1,
  "course_name": "Bachelor of Computer Science",
  "class_enrolled": 1,
  "semester": 1,
  "dob": "2005-01-15",
  "contact_number": "9876543210",
  "address": "123 Main Street, City",
  "category": "GENERAL",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "student@example.com",
    "phone": "9876543210",
    "dob": "2005-01-15",
    "role": "student"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

### 3. GET STUDENT ATTENDANCE
**Request Type:** GET  
**Endpoint:** `/students/{id}/attendance/`  
**Authentication:** Required ✅  
**Purpose:** View attendance records for a specific student

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/1/attendance/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "subject": 1,
    "subject_name": "Data Structures",
    "date": "2026-01-03",
    "status": true,
    "classes_attended": 2,
    "classes_held": 2
  },
  {
    "id": 2,
    "subject": 2,
    "subject_name": "Web Development",
    "date": "2026-01-03",
    "status": true,
    "classes_attended": 1,
    "classes_held": 1
  },
  {
    "id": 3,
    "subject": 1,
    "subject_name": "Data Structures",
    "date": "2026-01-02",
    "status": false,
    "classes_attended": 0,
    "classes_held": 2
  }
]
```

**Empty Response (No Attendance):**
```json
[]
```

---

### 4. GET STUDENT MARKS
**Request Type:** GET  
**Endpoint:** `/students/{id}/marks/`  
**Authentication:** Required ✅  
**Purpose:** View all marks/grades for a student

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/1/marks/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "subject": 1,
    "subject_code": "DS101",
    "subject_name": "Data Structures",
    "internal_marks": 40,
    "semester_marks": 60,
    "total_marks": 100
  },
  {
    "id": 2,
    "subject": 2,
    "subject_code": "WD201",
    "subject_name": "Web Development",
    "internal_marks": 38,
    "semester_marks": 58,
    "total_marks": 96
  },
  {
    "id": 3,
    "subject": 3,
    "subject_code": "DB301",
    "subject_name": "Database Management",
    "internal_marks": 42,
    "semester_marks": 65,
    "total_marks": 107
  }
]
```

**Empty Response (No Marks):**
```json
[]
```

---

### 5. GET STUDENT FEE STATUS
**Request Type:** GET  
**Endpoint:** `/students/{id}/fees/`  
**Authentication:** Required ✅  
**Purpose:** Check fee payment status and outstanding dues

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/1/fees/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK - Fees Pending):**
```json
{
  "student_id": 1,
  "roll_number": "CS001",
  "total_due": 0,
  "total_paid": 50000.00,
  "status": "paid"
}
```

**Response (200 OK - Fees Pending):**
```json
{
  "student_id": 1,
  "roll_number": "CS001",
  "total_due": 0,
  "total_paid": 25000.00,
  "status": "pending"
}
```

---

### 6. GET STUDENT FEE PAYMENTS HISTORY
**Request Type:** GET  
**Endpoint:** `/students/{id}/fee-payments/`  
**Authentication:** Required ✅  
**Purpose:** View complete payment history and transaction details

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/students/1/fee-payments/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "amount": "25000.00",
    "payment_date": "2026-01-01",
    "payment_method": "online",
    "transaction_id": "TXN001",
    "status": "paid"
  },
  {
    "id": 2,
    "amount": "25000.00",
    "payment_date": "2025-12-15",
    "payment_method": "bank_transfer",
    "transaction_id": "BANK002",
    "status": "paid"
  }
]
```

**Empty Response (No Payments):**
```json
[]
```

---

## 👤 PROFILE ENDPOINTS (4 APIs)

### 1. GET YOUR PROFILE
**Request Type:** GET  
**Endpoint:** `/auth/profile/`  
**Authentication:** Required ✅  
**Purpose:** View your own user profile information

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/auth/profile/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "student@example.com",
  "phone": "9876543210",
  "dob": "2005-01-15",
  "role": "student"
}
```

---

### 2. UPDATE YOUR PROFILE
**Request Type:** PUT  
**Endpoint:** `/auth/profile/`  
**Authentication:** Required ✅  
**Purpose:** Update your profile information (name, phone, address, DOB)

**Request:**
```http
PUT https://erp-9pbn.onrender.com/api/v1/auth/profile/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json

{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "phone": "9876543210",
  "address": "456 New Street, City",
  "dob": "2005-01-15"
}
```

**Response (200 OK):**
```json
{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "phone": "9876543210",
  "address": "456 New Street, City",
  "dob": "2005-01-15"
}
```

**Error Response (400 Bad Request):**
```json
{
  "phone": ["Ensure this field has no more than 15 characters."]
}
```

---

### 3. CHANGE PASSWORD
**Request Type:** POST  
**Endpoint:** `/auth/change-password/`  
**Authentication:** Required ✅  
**Purpose:** Change your login password

**Request:**
```http
POST https://erp-9pbn.onrender.com/api/v1/auth/change-password/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json

{
  "old_password": "password123",
  "new_password": "newpassword456",
  "confirm_password": "newpassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response (400 Bad Request - Wrong Old Password):**
```json
{
  "error": "Old password is incorrect"
}
```

**Error Response (400 Bad Request - Passwords Don't Match):**
```json
{
  "non_field_errors": ["Passwords do not match."]
}
```

---

### 4. LOGOUT
**Request Type:** POST  
**Endpoint:** `/auth/logout/`  
**Authentication:** Required ✅  
**Purpose:** Logout and invalidate your authentication token

**Request:**
```http
POST https://erp-9pbn.onrender.com/api/v1/auth/logout/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔔 NOTIFICATION ENDPOINTS (4 APIs)

### 1. LIST YOUR NOTIFICATIONS
**Request Type:** GET  
**Endpoint:** `/notifications/`  
**Authentication:** Required ✅  
**Purpose:** View all notifications sent to you

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/notifications/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "sender": 2,
    "sender_name": "Dr. Smith",
    "recipient": 1,
    "recipient_roll": "CS001",
    "title": "Fee Due Reminder",
    "message": "Your fee payment for this semester is due by 2026-01-31",
    "is_read": false,
    "created_at": "2026-01-03T10:30:00Z"
  },
  {
    "id": 2,
    "sender": 3,
    "sender_name": "Prof. Johnson",
    "recipient": 1,
    "recipient_roll": "CS001",
    "title": "Marks Published",
    "message": "Your marks for Data Structures have been published",
    "is_read": true,
    "created_at": "2026-01-01T14:15:00Z"
  }
]
```

---

### 2. GET NOTIFICATION DETAILS
**Request Type:** GET  
**Endpoint:** `/notifications/{id}/`  
**Authentication:** Required ✅  
**Purpose:** View a specific notification

**Request:**
```http
GET https://erp-9pbn.onrender.com/api/v1/notifications/1/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": 1,
  "sender": 2,
  "sender_name": "Dr. Smith",
  "recipient": 1,
  "recipient_roll": "CS001",
  "title": "Fee Due Reminder",
  "message": "Your fee payment for this semester is due by 2026-01-31",
  "is_read": false,
  "created_at": "2026-01-03T10:30:00Z"
}
```

---

### 3. MARK NOTIFICATION AS READ
**Request Type:** PUT  
**Endpoint:** `/notifications/{id}/mark_read/`  
**Authentication:** Required ✅  
**Purpose:** Mark a notification as read

**Request:**
```http
PUT https://erp-9pbn.onrender.com/api/v1/notifications/1/mark_read/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "id": 1,
  "sender": 2,
  "sender_name": "Dr. Smith",
  "recipient": 1,
  "recipient_roll": "CS001",
  "title": "Fee Due Reminder",
  "message": "Your fee payment for this semester is due by 2026-01-31",
  "is_read": true,
  "created_at": "2026-01-03T10:30:00Z"
}
```

---

### 4. DELETE NOTIFICATION
**Request Type:** DELETE  
**Endpoint:** `/notifications/{id}/`  
**Authentication:** Required ✅  
**Purpose:** Delete a notification

**Request:**
```http
DELETE https://erp-9pbn.onrender.com/api/v1/notifications/1/
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbea6f7f7f
Content-Type: application/json
```

**Response (204 No Content):**
```
(Empty response - just status 204)
```

---

## 📊 COMMON HTTP STATUS CODES

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK - Request successful | Data retrieved/updated successfully |
| 201 | Created - Resource created | New payment recorded |
| 204 | No Content - Request successful, no body | Notification deleted |
| 400 | Bad Request - Invalid data | Missing required fields |
| 401 | Unauthorized - Invalid/missing token | Token not provided |
| 403 | Forbidden - Not allowed | Accessing another student's data |
| 404 | Not Found - Resource doesn't exist | Student ID doesn't exist |
| 500 | Server Error - Server issue | Database connection error |

---

## 💡 TIPS FOR STUDENTS

1. **Always include token** in Authorization header
2. **Check status codes** to understand response
3. **Save your data** after updates
4. **Report errors** to your institution's support
5. **Keep password secure** - don't share with anyone

---

## 📝 EXAMPLE WORKFLOW FOR A STUDENT

1. **Login** → Get auth_token
2. **View Profile** → Check your information
3. **Check Attendance** → Monitor attendance percentage
4. **View Marks** → Check your grades
5. **Check Fees** → See payment status
6. **View Notifications** → Read important messages
7. **Update Profile** → Modify contact information if needed
8. **Logout** → End your session

---

## ⚠️ ERROR EXAMPLES

**401 Unauthorized (Missing Token):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**401 Unauthorized (Invalid Token):**
```json
{
  "detail": "Invalid token."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**400 Bad Request (Invalid Data):**
```json
{
  "field_name": ["Error message here"]
}
```

---

## 🔐 SECURITY NOTES

✅ **DO:**
- Keep your token confidential
- Use HTTPS in production
- Change password regularly
- Logout when done

❌ **DON'T:**
- Share your password
- Expose your token
- Use public WiFi for sensitive data
- Leave session active

---

**Total Accessible APIs for Students: 14**
- 6 Student Info APIs
- 4 Profile/Auth APIs
- 4 Notification APIs
