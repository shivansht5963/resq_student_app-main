# Dynamic Academics Dashboard Implementation Plan

## Goal
Make the Academics Home screen (`index.jsx`) fully dynamic by integrating real ERP data for all widgets.

## User Review Required
> [!NOTE]
> Upcoming Exams API is currently unavailable. The "Next Exam" card will fallback to showing the **most recent declared result** as requested.

## Proposed Changes

### `src/app/(tabs)/academics/index.jsx`
#### [MODIFY] `AcademicsHomeScreen`
- **Data Fetching**:
    - Fetch `Student ID` (lookup via `api.getStudents()`).
    - Fetch `Attendance` (`api.getStudentAttendance`).
    - Fetch `Marks` (`api.getStudentMarks`).
    - Fetch `Fees` (`api.getStudentFees`).
- **Data Processing**:
    - **Attendance Graph**: Calculate percentage per subject.
    - **Total Attendance**: Calculate overall aggregate percentage.
    - **Exams Card**: 
        - Default: Check for upcoming exams (currently mock/empty).
        - Fallback: Find the latest result (result with highest ID or date logic) and display "Recent: [Subject] [Grade/Marks]".
    - **Fees Card**: Display `total_due`.
- **UI State**:
    - Add state variables: `attendanceData`, `overallAttendance`, `recentResult`, `feesDue`, `loading`.
    - Render loading skeleton or spinner while fetching.
    - Render specific empty states if data is missing.

### `src/components/AttendanceGraph.jsx`
- Ensure it handles the passed `data` prop correctly (already verified).

## Verification
- **Manual**: 
    - Verify Graph matches Attendance tab data.
    - Verify "Total" attendance matches Attendance tab.
    - Verify "Exams" card shows a recent result (e.g., "Data Structures: 85.0").
    - Verify "Fees" card shows the correct due amount.
