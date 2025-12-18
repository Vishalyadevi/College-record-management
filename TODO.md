# Online Courses Fix - TODO

## Issue

- Student online courses page showed "failed to fetch pending online course" error

## Root Cause

- Frontend API endpoints in OnlineCoursesContext.jsx did not match backend routes
- Frontend was calling:
  - `/api/approved-courses` (non-existent)
  - `/api/pending-online-courses` (non-existent)
  - `/api/add-course` (non-existent)
  - `/api/update-course/{id}` (non-existent)
  - `/api/delete-course/{id}` (non-existent)

## Backend Routes (from server.js)

- Online courses routes mounted at `/api/online-courses`
- Routes defined in `onlinecourseRoute.js`:
  - GET `/` - getApprovedCourses
  - GET `/pending` - getPendingOnlineCourses
  - POST `/` - addOnlineCourse
  - PATCH `/:courseId` - updateOnlineCourse
  - DELETE `/:courseId` - deleteOnlineCourse

## Fix Applied

- [x] Updated fetchOnlineCourses to call `/api/online-courses`
- [x] Updated fetchPendingCourses to call `/api/online-courses/pending`
- [x] Updated addOnlineCourse to call `/api/online-courses`
- [x] Updated updateOnlineCourse to call `/api/online-courses/${courseId}`
- [x] Updated deleteOnlineCourse to call `/api/online-courses/${courseId}`

## Testing

- [ ] Test the online courses page to ensure it loads without errors
- [ ] Verify pending courses are displayed correctly
- [ ] Verify approved courses are displayed correctly
- [ ] Test adding, updating, and deleting courses
