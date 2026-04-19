# Delete vs Block User Guide

## Overview

Fixed the admin customers page to have proper **Delete** and **Block** functionality with different outcomes.

## Button Functionality

### 🚫 Block Button

- **Action**: Deactivates the user account
- **Outcome**: User **cannot login** until unblocked
- **Data**: All user data remains in database (orders, addresses, etc.)
- **Reversible**: Yes - admin can click "Unblock" to restore access
- **API Endpoint**: `POST /users/:id/block` or `POST /users/:id/unblock`
- **Use Case**: Temporary account suspension due to suspicious activity

### 🗑️ Delete Button

- **Action**: Permanently removes all user data
- **Outcome**: User account is completely deleted with all associated:
  - ✅ User profile
  - ✅ All addresses
  - ✅ All orders
  - ✅ All notifications
- **Data**: Purged from database completely
- **Reversible**: No - irreversible action
- **API Endpoint**: `DELETE /users/:id`
- **Use Case**: Permanent account removal per user request or policy

## Backend Changes Made

### 1. user.service.ts

```typescript
// New functions added:
- blockUser(id: string): Deactivates user (sets isActive = false)
- unblockUser(id: string): Reactivates user (sets isActive = true)
- deleteUser(id: string): Permanently deletes user and all related data
```

### 2. user.controller.ts

```typescript
// New controller functions:
-blockUser() - unblockUser() - deleteUser();
```

### 3. user.routes.ts

```typescript
router.post("/:id/block", authorize("ADMIN"), userController.blockUser);
router.post("/:id/unblock", authorize("ADMIN"), userController.unblockUser);
router.delete("/:id", authorize("ADMIN"), userController.deleteUser);
```

### 4. adminApi.ts (Frontend Service)

```typescript
// Updated methods:
blockUser(id: string): Calls POST /users/:id/block
unblockUser(id: string): Calls POST /users/:id/unblock
deleteUser(id: string): Calls DELETE /users/:id
```

### 5. Admin Customers Page (customers/page.tsx)

```typescript
// Replaced single toggleUserActive mutation with:
- blockMutation: Calls blockUser API
- unblockMutation: Calls unblockUser API
- deleteMutation: Calls deleteUser API

// Updated UI buttons:
- Block/Unblock Button: Toggles user's active status
- Delete Button: Permanently removes user from database
```

## Database Impact

### When Blocking a User

- `User.isActive` set to `false`
- All data preserved
- User cannot authenticate (login will fail)
- Account can be reactivated with Unblock

### When Deleting a User

- `Order` records associated with user → DELETED
- `Address` records associated with user → DELETED
- `Notification` records for user → DELETED
- `User` record → DELETED
- Cache entry → CLEARED

## Testing the Functionality

### Test Block/Unblock

1. Open Admin Panel → Customers
2. Click **Block** button on any customer
3. Verify badge changes to "Blocked"
4. Try logging in with that customer on mobile - should fail
5. Click **Unblock** to restore access

### Test Delete

1. Open Admin Panel → Customers
2. Click **Delete** button on any customer
3. Confirm the dialog
4. Customer is immediately removed from the list
5. All user data (orders, addresses) is deleted
6. Customer's phone number becomes available for new registration

## API Endpoints

| Method | Endpoint             | Purpose                        | Auth Required |
| ------ | -------------------- | ------------------------------ | ------------- |
| POST   | `/users/:id/block`   | Block user (prevent login)     | ADMIN         |
| POST   | `/users/:id/unblock` | Unblock user (allow login)     | ADMIN         |
| DELETE | `/users/:id`         | Permanently delete user & data | ADMIN         |

## Error Handling

Both operations validate that:

- User exists before performing action
- Only ADMIN role can perform these actions
- Appropriate error messages are returned
- Cache is cleared on successful operation

## Status

✅ **Implementation Complete**
✅ **TypeScript Compilation: PASSED**
✅ **API Server: Running on port 4000**
✅ **Ready for Testing**
