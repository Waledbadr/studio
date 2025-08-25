# Feedback System

This document summarizes the feedback system added to the app.

- Collections:
  - feedback
    - Fields: ticketId, userId, title, description, category, categoryAuto, status, priority, screenshotUrl, errorCode, errorMessage, stack, deviceInfo, appInfo, settings, createdAt, updatedAt
    - Subcollection: updates (developerComment, updatedBy, updatedAt)
  - notifications (existing)

- API Routes:
  - POST /api/uploads/feedback -> upload dataURL image to Vercel Blob (needs BLOB_READ_WRITE_TOKEN)
  - GET /api/feedback -> list (optionally by ?userId=)
  - POST /api/feedback -> create (also created directly in client)
  - PATCH /api/feedback/[id] -> update status, add developer comment, and notify the user

- UI:
  - Floating FeedbackWidget in layout (Arabic labels)
  - /feedback page: user's own submissions
  - /admin/feedback: moderation dashboard (status updates + comment)
  - /admin/feedback/stats: simple charts

- Rate limiting: middleware limits /api/feedback and /api/uploads/feedback (10/min/IP)

- Setup:
  - Add env var BLOB_READ_WRITE_TOKEN for uploads
  - Ensure Firestore is configured (see .env.local)

- Firestore Rules (hardened):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'Admin'; }
    function isOwner(userId) { return isSignedIn() && userId == request.auth.uid; }

    match /feedback/{feedbackId} {
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if isAdmin() || isOwner(resource.data.userId);
      allow update, delete: if isAdmin();

      match /updates/{updateId} {
        function parentOwner() { return get(/databases/$(database)/documents/feedback/$(feedbackId)).data.userId; }
        allow read: if isAdmin() || isOwner(parentOwner());
        allow create, update, delete: if isAdmin();
      }
    }

    match /notifications/{notificationId} {
      allow create: if isAdmin() || (isSignedIn() && request.resource.data.userId == request.auth.uid);
      allow read: if isAdmin() || isOwner(resource.data.userId);
      allow update: if isAdmin() || isOwner(resource.data.userId);
      allow delete: if isAdmin();
    }
  }
}
```

Note: these rules assume a `users/{uid}` doc with a `role` field. Ensure Admin accounts have role = `Admin`.

- Push notifications: integrate your FCM if needed; currently, in-app notifications are created on status updates.
