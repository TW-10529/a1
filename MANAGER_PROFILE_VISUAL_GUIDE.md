# Manager Profile Implementation - Visual Guide

## 1. Manager Sidebar Navigation

### Before
```
Dashboard
├─ Manage Employees
├─ Schedule Management
├─ Role Management
├─ Overtime Approvals
├─ Leave Management
├─ Comp-Off Requests
├─ Attendance
└─ Notifications
```

### After
```
Dashboard
├─ PROFILE (NEW) ← Click to view profile
├─ Manage Employees
├─ Schedule Management
├─ Role Management
├─ Overtime Approvals
├─ Leave Management
├─ Comp-Off Requests
├─ Attendance
└─ Notifications
```

## 2. Manager Profile Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Manager Profile | My Profile                       [Refresh] │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Personal Information                                         │
├─────────────────────────────────────────────────────────────┤
│ 👤 Full Name: Manager One                                   │
│ 📝 Username: manager1                                       │
│ 📧 Email: manager1@company.com                             │
│ 🔒 Password: ••••••••                        [✏️ Change]    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Manager Details                                             │
├─────────────────────────────────────────────────────────────┤
│ Manager ID: M001                                           │
│ 🏢 Department: IT Department                               │
│ Status: [Active] (green badge)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ System Information                                          │
├─────────────────────────────────────────────────────────────┤
│ Created At: 07 Jan 2026 04:12:02                          │
│ Updated At: 07 Jan 2026 04:12:02                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Last Updated: 07 Jan 2026 04:12:02                        │
└─────────────────────────────────────────────────────────────┘
```

## 3. Password Change Modal

```
┌──────────────────────────────────────────────┐
│  Change Password                         [X] │
├──────────────────────────────────────────────┤
│                                              │
│ 🔐 Current Password                         │
│ [________________________________]          │
│                                              │
│ 🔐 New Password                             │
│ [________________________________]          │
│                                              │
│ 🔐 Confirm Password                         │
│ [________________________________]          │
│                                              │
│ [Cancel]                      [Update]       │
│                                              │
└──────────────────────────────────────────────┘
```

## 4. Real-Time Update Behavior

```
User opens profile page
          ↓
Page loads current data
          ↓
Auto-refresh timer starts (30 seconds)
          ↓
[Every 30 seconds] OR [When user returns to window]
          ↓
Fetch latest profile data
          ↓
Update display if changed
          ↓
User can click [Refresh] button for immediate update
```

## 5. Bilingual Interface

### English
- Profile
- My Profile
- Personal Information
- Manager Details
- Full Name
- Username
- Email
- Password
- Change Password
- Manager ID
- Department
- Status
- Active / Inactive
- System Information
- Created At
- Updated At
- Last Updated

### Japanese (日本語)
- プロフィール
- マイプロフィール
- 個人情報
- マネージャー詳細
- フルネーム
- ユーザー名
- メール
- パスワード
- パスワード変更
- マネージャーID
- 部門
- ステータス
- アクティブ / 非アクティブ
- システム情報
- 作成日時
- 更新日時
- 最終更新日時

## 6. Component Architecture

```
App
└── Routes
    ├── /admin → AdminDashboard
    │   └── Routes (Admin pages)
    ├── /manager → ManagerDashboard
    │   └── Routes
    │       ├── /dashboard → ManagerDashboardHome
    │       ├── /profile → ManagerProfilePage (NEW)
    │       │   ├── Header
    │       │   ├── Profile sections (3)
    │       │   ├── Password modal
    │       │   └── Real-time auto-refresh
    │       ├── /employees → ManagerEmployees
    │       └── ... other routes
    └── / → Employee dashboard
        └── /profile → EmployeeProfilePage
```

## 7. Data Flow

```
ManagerProfilePage.jsx
│
├─ useEffect (on mount)
│  └─ loadProfile()
│     └─ getManagerProfile()
│        └─ API: GET /manager/profile
│           └─ Backend: Query Manager + User + Department
│              └─ Response: ManagerProfileResponse JSON
│
├─ Auto-refresh interval (30 seconds)
│  └─ loadProfile() [same as above]
│
├─ Window focus event listener
│  └─ loadProfile() [same as above]
│
└─ Password change
   └─ handlePasswordSubmit()
      └─ changePassword(passwordData)
         └─ API: POST /user/change-password
            └─ Backend: Verify old password + Hash new password
               └─ Response: PasswordChangeResponse
                  ├─ Success → Show modal message → Close after 2s
                  └─ Error → Show error message
```

## 8. Responsive Design

### Desktop (1024px+)
- 2-column grid for profile fields
- Full sidebar visible
- Refresh button in top right

### Tablet (768px - 1023px)
- 2-column grid for profile fields
- Sidebar collapsible
- Responsive spacing

### Mobile (< 768px)
- 1-column grid for profile fields
- Full-screen view (sidebar hidden or hamburger)
- Touch-friendly buttons
- Mobile-optimized modal

## 9. Error Handling

### Profile Load Error
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Failed to load profile                                    │
│ [Try Again]                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Password Change Errors
- Passwords do not match → Show error message
- New password same as old → Show error message
- Password too short (< 6 chars) → Show error message
- Current password incorrect → Show error message
- Server error → Show error message with retry option

## 10. Key Features Comparison

| Feature | Employee Profile | Manager Profile |
|---------|-----------------|-----------------|
| Full Name | ✓ | ✓ |
| Username | ✓ | ✓ |
| Email | ✓ | ✓ |
| Password Change | ✓ | ✓ |
| Real-time Refresh | ✓ | ✓ |
| Bilingual Support | ✓ | ✓ |
| Employment Type | ✓ | ✗ |
| Hire Date | ✓ | ✗ |
| Shifts Per Week | ✓ | ✗ |
| Manager ID | ✗ | ✓ |
| Department | ✗ (via context) | ✓ |
| Status Badge | ✗ | ✓ |

