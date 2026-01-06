"""
Excel Export Translations
This module provides translations for Excel headers and titles in multiple languages
"""

EXCEL_TRANSLATIONS = {
    'en': {
        # General
        'monthly_attendance_summary': 'Monthly Attendance Summary',
        'monthly_attendance_report': 'Monthly Attendance Report',
        'monthly_report': 'Monthly Report',
        'weekly_attendance_report': 'Weekly Attendance Report',
        'employee_monthly_report': 'Monthly Attendance Report',
        'leave_and_compoff_report': 'Leave & Comp-Off Report',
        'comprehensive_report': 'Comprehensive Monthly Attendance Report',
        
        # Department Statistics
        'department_statistics': 'DEPARTMENT STATISTICS',
        'weekly_statistics': 'WEEKLY STATISTICS',
        'total_days_in_month': 'Total Days in Month',
        'public_holidays': 'Public Holidays',
        'weekends': 'Weekends (Sat/Sun)',
        'total_non_working_days': 'Total Non-Working Days',
        'working_days_available': 'Working Days Available',
        'working_days_completed': 'Total Working Days Completed',
        'working_days_worked': 'Working Days Worked',
        'total_working_hours_all': 'Total Working Hours (All Employees)',
        'total_overtime_hours_all': 'Total Overtime Hours (All Employees)',
        'total_employees': 'Total Employees',
        'employees_present': 'Employees Present (with attendance)',
        'public_holidays_in_month': 'PUBLIC HOLIDAYS IN THIS MONTH',
        
        # Attendance Details Headers
        'employee_id': 'Employee ID',
        'name': 'Name',
        'date': 'Date',
        'day': 'Day',
        'leave_status': 'Leave Status',
        'assigned_shift': 'Assigned Shift',
        'total_hrs_assigned': 'Total Hrs Assigned',
        'check_in': 'Check-In',
        'check_out': 'Check-Out',
        'total_hrs_worked': 'Total Hrs Worked',
        'hours_worked': 'Hours Worked',
        'break_time': 'Break Time',
        'break_minutes': 'Break (min)',
        'overtime_hours': 'Overtime Hours',
        'status': 'Status',
        'comp_off_earned': 'Comp-Off Earned',
        'comp_off_used': 'Comp-Off Used',
        'comp_off_earned_days': 'Comp-Off Earned Days',
        'comp_off_used_days': 'Comp-Off Used Days',
        'night_hours': 'Night Hours (After 22:00)',
        'notes': 'Notes',
        
        # Daily Attendance Headers
        'daily_attendance': 'Daily Attendance',
        'scheduled_time': 'Scheduled Time',
        'night_hours_calc': 'Night Hours',
        'ot_hours': 'OT Hours',
        
        # Summary Sections
        'attendance_summary': 'Attendance Summary',
        'leave_summary': 'Leave Summary',
        'comp_off_summary': 'Comp-Off Summary',
        'hours_summary': 'Hours Summary',
        
        # Employee Leave Summary
        'annual_paid_leave_entitlement': 'Annual Paid Leave Entitlement',
        'paid_leave_days_used': 'Paid Leave Days Used',
        'paid_leave_days_remaining': 'Paid Leave Days Remaining',
        'unpaid_leave_days': 'Unpaid Leave Days',
        'total_leave_days': 'Total Leave Days',
        'comp_off_balance': 'Comp-Off Balance',
        
        # Hours Summary
        'total_hours_worked': 'Total Hours Worked',
        'total_overtime_hours': 'Total Overtime Hours',
        'total_night_hours': 'Total Night Hours',
        
        # Summary Information
        'summary': 'Summary',
        'attendance_details': 'Attendance Details',
        
        # Employee Monthly Summary
        'employee_summary': 'Summary',
        'total_days_worked': 'Total Days Worked',
        'total_ot': 'Total OT',
        'paid_leave_taken': 'Paid Leave Taken',
        'unpaid_leave_taken': 'Unpaid Leave Taken',
        
        # Leave Report
        'leave_requests': 'Leave Requests',
        'comp_off_details': 'Comp-Off Details',
        'leave_type': 'Leave Type',
        'from_date': 'From Date',
        'to_date': 'To Date',
        'duration': 'Duration',
        'approval_status': 'Status',
        'manager_notes': 'Manager Notes',
        'comp_off_type': 'Type',
        'month_earned': 'Month',
        'comp_off_earned_label': 'Earned',
        'comp_off_used_label': 'Used',
        'comp_off_expired_label': 'Expired',
        'total_earned': 'Total Comp-Off Earned',
        'total_used': 'Total Comp-Off Used',
        'available_balance': 'Comp-Off Available',
        'expired_balance': 'Comp-Off Expired',
    },
    'ja': {
        # General
        'monthly_attendance_summary': '月間勤務時間サマリー',
        'monthly_attendance_report': '月間勤務時間レポート',
        'monthly_report': '月間レポート',
        'weekly_attendance_report': '週間勤務時間レポート',
        'employee_monthly_report': '月間勤務時間レポート',
        'leave_and_compoff_report': '休暇・代休レポート',
        'comprehensive_report': '総合月間勤務時間レポート',
        
        # Department Statistics
        'department_statistics': '部門統計',
        'weekly_statistics': '週間統計',
        'total_days_in_month': '月間総日数',
        'public_holidays': '祝日',
        'weekends': '週末（土日）',
        'total_non_working_days': '総休業日',
        'working_days_available': '利用可能な勤務日',
        'working_days_completed': '完了した勤務日',
        'working_days_worked': '勤務日数',
        'total_working_hours_all': '合計勤務時間（全従業員）',
        'total_overtime_hours_all': '合計残業時間（全従業員）',
        'total_employees': '従業員総数',
        'employees_present': '出勤者数（勤務実績あり）',
        'public_holidays_in_month': '今月の祝日',
        
        # Attendance Details Headers
        'employee_id': '従業員ID',
        'name': '名前',
        'date': '日付',
        'day': '曜日',
        'leave_status': '休暇ステータス',
        'assigned_shift': '割り当てシフト',
        'total_hrs_assigned': '割り当て時間合計',
        'check_in': 'チェックイン',
        'check_out': 'チェックアウト',
        'total_hrs_worked': '合計勤務時間',
        'hours_worked': '勤務時間',
        'break_time': '休憩時間',
        'break_minutes': '休憩（分）',
        'overtime_hours': '残業時間',
        'status': 'ステータス',
        'comp_off_earned': '代休取得',
        'comp_off_used': '代休使用',
        'comp_off_earned_days': '代休取得日',
        'comp_off_used_days': '代休使用日',
        'night_hours': '夜間時間（22:00以降）',
        'notes': '備考',
        
        # Daily Attendance Headers
        'daily_attendance': '日別勤務時間',
        'scheduled_time': '予定時刻',
        'night_hours_calc': '夜間時間',
        'ot_hours': 'OT時間',
        
        # Summary Sections
        'attendance_summary': '勤務時間サマリー',
        'leave_summary': '休暇サマリー',
        'comp_off_summary': '代休サマリー',
        'hours_summary': '時間サマリー',
        
        # Employee Leave Summary
        'annual_paid_leave_entitlement': '年間有給休暇配当',
        'paid_leave_days_used': '有給休暇使用日',
        'paid_leave_days_remaining': '有給休暇残日',
        'unpaid_leave_days': '無給休暇日',
        'total_leave_days': '総休暇日',
        'comp_off_balance': '代休残高',
        
        # Hours Summary
        'total_hours_worked': '合計勤務時間',
        'total_overtime_hours': '合計残業時間',
        'total_night_hours': '合計夜間時間',
        
        # Summary Information
        'summary': 'サマリー',
        'attendance_details': '勤務時間詳細',
        
        # Employee Monthly Summary
        'employee_summary': 'サマリー',
        'total_days_worked': '勤務日数合計',
        'total_ot': '合計残業時間',
        'paid_leave_taken': '取得した有給休暇',
        'unpaid_leave_taken': '取得した無給休暇',
        
        # Leave Report
        'leave_requests': '休暇申請',
        'comp_off_details': '代休詳細',
        'leave_type': '休暇タイプ',
        'from_date': '開始日',
        'to_date': '終了日',
        'duration': '期間',
        'approval_status': 'ステータス',
        'manager_notes': 'マネージャーメモ',
        'comp_off_type': 'タイプ',
        'month_earned': '月',
        'comp_off_earned_label': '取得',
        'comp_off_used_label': '使用',
        'comp_off_expired_label': '期限切れ',
        'total_earned': '代休総取得数',
        'total_used': '代休総使用数',
        'available_balance': '代休残高',
        'expired_balance': '代休期限切れ',
    }
}


def get_excel_translation(key: str, language: str = 'en') -> str:
    """
    Get translated text for Excel exports
    
    Args:
        key: Translation key
        language: Language code ('en' or 'ja')
    
    Returns:
        Translated text, or key itself if not found
    """
    translations = EXCEL_TRANSLATIONS.get(language, EXCEL_TRANSLATIONS['en'])
    return translations.get(key, EXCEL_TRANSLATIONS['en'].get(key, key))


def get_headers_translated(language: str = 'en', report_type: str = 'monthly') -> dict:
    """
    Get all headers translated for a specific report type
    
    Args:
        language: Language code ('en' or 'ja')
        report_type: Type of report ('monthly', 'weekly', 'employee', 'leave')
    
    Returns:
        Dictionary of translated headers
    """
    headers_map = {
        'monthly': [
            'employee_id',
            'name',
            'date',
            'leave_status',
            'assigned_shift',
            'total_hrs_assigned',
            'check_in',
            'check_out',
            'total_hrs_worked',
            'break_time',
            'overtime_hours',
            'status',
            'comp_off_earned',
            'comp_off_used',
        ],
        'employee': [
            'date',
            'scheduled_time',
            'check_in',
            'check_out',
            'hours_worked',
            'night_hours_calc',
            'break_minutes',
            'ot_hours',
            'status',
        ],
    }
    
    header_keys = headers_map.get(report_type, headers_map['monthly'])
    return {key: get_excel_translation(key, language) for key in header_keys}
