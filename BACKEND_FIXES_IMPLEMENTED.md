Student App - Incident System API Guide
Version: 2.0 | Updated: 2026-01-01

Overview
The Student App interacts with the incident system primarily through:

Reporting emergencies (SOS button)
Polling for guard assignment status
Viewing incident timeline (optional)
Complete Workflow
┌─────────────────────────────────────────────────────────────────┐
│                    STUDENT SOS WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Student taps SOS button                                     │
│         │                                                       │
│         ▼                                                       │
│  2. POST /api/incidents/sos/                                    │
│         │                                                       │
│         ▼                                                       │
│  3. Receive incident object (status: CREATED)                   │
│         │                                                       │
│         ▼                                                       │
│  4. Start polling: GET /api/incidents/{id}/status_poll/         │
│         │         (every 5 seconds)                             │
│         │                                                       │
│         ├── assignment_status: "WAITING_FOR_GUARD"              │
│         │         (keep polling)                                │
│         │                                                       │
│         ├── assignment_status: "GUARD_ASSIGNED"                 │
│         │         (stop polling, show guard info)               │
│         │                                                       │
│         └── status: "RESOLVED"                                  │
│                   (stop polling, show resolved)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
Endpoint 1: Report SOS
POST /api/incidents/sos/
Called when student presses the SOS button.

Request
POST /api/incidents/sos/
Authorization: Bearer <access_token>
Content-Type: application/json
{
  "beacon_id": "safe:uuid:403:403"
}
Field	Type	Required	Description
beacon_id
string	Yes	Hardware beacon ID from BLE scan
Response - Success (201 Created)
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "beacon": {
    "id": 1,
    "beacon_id": "safe:uuid:403:403",
    "location_name": "Library Floor 2",
    "building": "Main Building",
    "floor": 2,
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "status": "CREATED",
  "priority": 3,
  "description": "",
  "report_type": null,
  "location": "",
  "signals": [
    {
      "id": 1,
      "signal_type": "STUDENT_SOS",
      "source_user": {
        "id": "student-uuid",
        "full_name": "John Student",
        "email": "john@student.edu"
      },
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-01-01T10:00:00Z"
}
Response - Error (400 Bad Request)
{
  "error": "beacon_id is required"
}
{
  "error": "Invalid or inactive beacon: safe:uuid:999:999"
}
Implementation Notes
// React Native / Expo example
const reportSOS = async (beaconId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/incidents/sos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ beacon_id: beaconId }),
    });
    
    if (response.status === 201) {
      const incident = await response.json();
      // Store incident.id for polling
      startPolling(incident.id);
      return incident;
    }
  } catch (error) {
    console.error('SOS report failed:', error);
  }
};
Endpoint 2: Poll for Status Updates
GET /api/incidents/{id}/status_poll/
Poll this endpoint every 5 seconds after reporting SOS to check if a guard has been assigned.

Request
GET /api/incidents/a1b2c3d4-e5f6-7890-abcd-ef1234567890/status_poll/
Authorization: Bearer <access_token>
Response - Success (200 OK)
{
  "incident_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "ASSIGNED",
  "priority": 3,
  "assignment_status": "GUARD_ASSIGNED",
  "assigned_guard": {
    "id": "guard-uuid-1234",
    "full_name": "John Guard",
    "email": "john@guard.edu"
  },
  "assigned_at": "2026-01-01T10:01:30Z",
  "alert_stats": {
    "sent": 3,
    "accepted": 1,
    "declined": 1,
    "expired": 0
  },
  "pending_alerts": []
}
Assignment Status Values
Value	Meaning	UI Action
WAITING_FOR_GUARD	Alerts sent, waiting for response	Show "Finding nearby guard..."
GUARD_ASSIGNED	Guard accepted, on the way	Show guard info, stop polling
NO_ASSIGNMENT	No alerts sent yet	Show "Processing..."
When to Stop Polling
Stop polling when:

assignment_status becomes "GUARD_ASSIGNED"
status
 becomes "RESOLVED"
User cancels the incident
Timeout (e.g., 10 minutes)
Implementation Example
// Polling logic
const pollForStatus = (incidentId: string) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `${API_URL}/api/incidents/${incidentId}/status_poll/`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    
    const data = await response.json();
    
    // Update UI based on assignment_status
    setAssignmentStatus(data.assignment_status);
    
    if (data.assignment_status === 'GUARD_ASSIGNED') {
      setAssignedGuard(data.assigned_guard);
      clearInterval(interval); // Stop polling
    }
    
    if (data.status === 'RESOLVED') {
      setIncidentResolved(true);
      clearInterval(interval); // Stop polling
    }
  }, 5000); // Every 5 seconds
  
  return interval;
};
Endpoint 3: View Incident Timeline (Optional)
GET /api/incidents/{id}/timeline/
View full event history of an incident (for transparency/audit).

Request
GET /api/incidents/a1b2c3d4-e5f6-7890-abcd-ef1234567890/timeline/
Authorization: Bearer <access_token>
Response - Success (200 OK)
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "beacon": {
    "id": 1,
    "location_name": "Library Floor 2",
    "building": "Main Building"
  },
  "status": "RESOLVED",
  "priority": 3,
  "description": "",
  "current_assignment": null,
  "resolution_info": {
    "resolved_by": {
      "id": "guard-uuid",
      "full_name": "John Guard"
    },
    "resolved_at": "2026-01-01T10:15:00Z",
    "resolution_type": "RESOLVED_BY_GUARD",
    "resolution_notes": "Student was having anxiety. Provided support and contacted counseling."
  },
  "events": [
    {
      "id": 1,
      "event_type": "INCIDENT_CREATED",
      "event_type_display": "Incident Created",
      "actor": {
        "id": "student-uuid",
        "full_name": "John Student",
        "email": "john@student.edu",
        "role": "STUDENT"
      },
      "target_guard": null,
      "previous_status": "",
      "new_status": "CREATED",
      "previous_priority": null,
      "new_priority": 3,
      "details": {
        "signal_type": "STUDENT_SOS",
        "beacon_name": "Library Floor 2"
      },
      "created_at": "2026-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "event_type": "ALERT_SENT",
      "event_type_display": "Alert Sent to Guard",
      "actor": null,
      "target_guard": {
        "id": "guard-uuid-1",
        "full_name": "Guard One",
        "email": "guard1@edu"
      },
      "details": {
        "priority_rank": 1,
        "distance_km": 0.5
      },
      "created_at": "2026-01-01T10:00:05Z"
    },
    {
      "id": 3,
      "event_type": "ALERT_ACCEPTED",
      "event_type_display": "Guard Accepted Alert",
      "target_guard": {
        "id": "guard-uuid-1",
        "full_name": "Guard One"
      },
      "created_at": "2026-01-01T10:00:30Z"
    },
    {
      "id": 4,
      "event_type": "GUARD_ASSIGNED",
      "event_type_display": "Guard Assigned",
      "target_guard": {
        "id": "guard-uuid-1",
        "full_name": "Guard One"
      },
      "previous_status": "CREATED",
      "new_status": "ASSIGNED",
      "created_at": "2026-01-01T10:00:30Z"
    },
    {
      "id": 5,
      "event_type": "INCIDENT_RESOLVED",
      "event_type_display": "Incident Resolved",
      "actor": {
        "id": "guard-uuid-1",
        "full_name": "Guard One",
        "role": "GUARD"
      },
      "previous_status": "ASSIGNED",
      "new_status": "RESOLVED",
      "details": {
        "resolution_type": "RESOLVED_BY_GUARD",
        "resolution_notes": "Student was having anxiety..."
      },
      "created_at": "2026-01-01T10:15:00Z"
    }
  ],
  "created_at": "2026-01-01T10:00:00Z",
  "updated_at": "2026-01-01T10:15:00Z",
  "resolved_at": "2026-01-01T10:15:00Z"
}
Event Types (for display)
Event Type	Display Text	Description
INCIDENT_CREATED	Incident Created	SOS reported
ALERT_SENT	Alert Sent to Guard	Guard notified
ALERT_ACCEPTED	Guard Accepted Alert	Guard will respond
ALERT_DECLINED	Guard Declined Alert	Guard unavailable
GUARD_ASSIGNED	Guard Assigned	Guard on the way
INCIDENT_RESOLVED	Incident Resolved	Case closed
Endpoint 4: View Event List (Optional)
GET /api/incidents/{id}/events/
Get just the events without full incident details.

Request
GET /api/incidents/a1b2c3d4.../events/?event_type=ALERT_SENT&limit=10
Authorization: Bearer <access_token>
Query Param	Type	Description
event_type	string	Filter by event type
limit	integer	Max results (default: 50)
Response
{
  "count": 2,
  "events": [
    {
      "id": 2,
      "event_type": "ALERT_SENT",
      "event_type_display": "Alert Sent to Guard",
      "target_guard": {"full_name": "Guard One"},
      "created_at": "2026-01-01T10:00:05Z"
    },
    {
      "id": 3,
      "event_type": "ALERT_SENT",
      "event_type_display": "Alert Sent to Guard",
      "target_guard": {"full_name": "Guard Two"},
      "created_at": "2026-01-01T10:00:06Z"
    }
  ]
}
Error Handling
Common Errors
Status	Response	Action
401	{"detail": "Authentication credentials were not provided."}	Redirect to login
403	{"error": "You do not have permission..."}	Show access denied
404	{"detail": "Not found."}	Incident doesn't exist
Summary of Changes (v2.0)
No Breaking Changes for Student App
The Student App workflow remains the same. New optional features:

Timeline endpoint - View full event history
Events endpoint - View filtered events
Better status_poll - More detailed response
Recommended Updates
 Add loading states for "Finding guard..."
 Show guard info when assigned
 (Optional) Add timeline screenbackend