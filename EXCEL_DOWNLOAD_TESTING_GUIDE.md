# Excel Download Language Support - Testing Guide

## Issue: Fixed ✅

Excel downloads were not working in Japanese language due to missing `language` variable in component destructuring.

## What Was Fixed

### Frontend Changes
1. **Manager.jsx** - ManagerAttendance component (line 2598)
   - Added `language` to useLanguage destructuring
   - Now properly passes language to all download functions

2. **Admin.jsx** - AdminDepartments component (line 956)
   - Added `language` to useLanguage destructuring
   - Now properly passes language to all download functions

### Why This Fixes It
- The download functions were trying to use the `language` variable
- But it wasn't being imported from the context
- Now when users select Japanese, the language parameter is correctly sent to the API
- Backend receives `language=ja` and generates Excel with Japanese headers

## How to Test

### Step 1: Start the Application
```bash
# Terminal 1 - Backend
cd /home/tw10529/Major2_Jap/backend
python -m uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd /home/tw10529/Major2_Jap/frontend
npm run dev
```

### Step 2: Test Manager Downloads
1. Login as a manager (e.g., manager1/manager123)
2. Click the language toggle button (top right) to select Japanese (日本語)
3. Go to **Attendance** tab
4. You should see download buttons:
   - 📥 Download Monthly Report
   - 📥 Download Weekly Report
   - 📥 Download Individual Employee Monthly Report

5. Click one of the download buttons
6. Open the downloaded Excel file
7. Verify:
   - Column headers are in Japanese (e.g., "従業員ID", "名前", "日付")
   - Title shows in Japanese (e.g., "月間勤務時間レポート")
   - Department statistics are in Japanese

### Step 3: Test Admin Downloads
1. Login as admin (e.g., admin/admin123)
2. Select Japanese language
3. Go to **Departments** section
4. Select a department and click download buttons
5. Verify headers and titles are in Japanese

### Step 4: Test Employee Downloads
1. Login as employee (e.g., emp1/emp123)
2. Select Japanese language
3. Go to **My Attendance** tab
4. Click "Download Report" button
5. Verify Excel is in Japanese

### Step 5: Test Comp-Off Download
1. Login as employee
2. Select Japanese language
3. Go to **Comp-Off Management**
4. Click "Download Report" button
5. Verify comp-off report is in Japanese

## Expected Output

### English Headers Example
```
Employee ID | Name | Date | Leave Status | Assigned Shift | Total Hrs Assigned | Check-In | Check-Out | Total Hrs Worked | Break Time | Overtime Hours
```

### Japanese Headers Example
```
従業員ID | 名前 | 日付 | 休暇ステータス | 割り当てシフト | 割り当て時間合計 | チェックイン | チェックアウト | 合計勤務時間 | 休憩時間 | 残業時間
```

## Troubleshooting

### Problem: Excel still downloading in English
**Solution:** 
- Ensure you selected Japanese in the language toggle (check browser localStorage)
- Verify language parameter is in the API request (check browser DevTools Network tab)
- Should see: `/attendance/export/monthly?...&language=ja`

### Problem: "Export failed" error
**Solution:**
- Check backend console for errors
- Ensure `excel_translations.py` is properly imported
- Verify backend is running with latest changes

### Problem: Missing Japanese text
**Solution:**
- Verify all Excel translation keys are present in `excel_translations.py`
- Check that the translation exists for the key being used

## Technical Details

### How Language Parameter Flows Through System

```
User selects Japanese (日本語)
    ↓
localStorage['language'] = 'ja'
    ↓
useLanguage() hook reads from localStorage
    ↓
Component destructures: const { t, language } = useLanguage()
    ↓
Download function executes with language variable
    ↓
API call includes: ?language=ja parameter
    ↓
Backend receives request
    ↓
Uses: get_excel_translation(key, language)
    ↓
Excel generated with Japanese translations
    ↓
File downloaded to user's computer
```

### API Endpoints Updated

All these endpoints now support `?language=en|ja`:
- `/attendance/export/monthly`
- `/attendance/export/weekly`
- `/attendance/export/employee-monthly`
- `/manager/export-leave-compoff/{employee_id}`
- `/comp-off/export/employee`

## Verification Checklist

- [ ] Backend imports `excel_translations.py` successfully
- [ ] Frontend components have correct language destructuring
- [ ] Translation test passes: `python test_excel_translations.py`
- [ ] Can select Japanese language in UI
- [ ] Download button appears in correct component
- [ ] Downloaded Excel has Japanese headers when language is Japanese
- [ ] Downloaded Excel has English headers when language is English
- [ ] All Excel sheets are properly translated
- [ ] No errors in browser console
- [ ] No errors in backend console

## Success Criteria

✅ User selects Japanese language
✅ User downloads Excel file
✅ Excel file opens correctly
✅ All headers and titles are in Japanese (日本語)
✅ Data is properly formatted
✅ Same functionality works for English

When all above are verified, the implementation is working correctly!
