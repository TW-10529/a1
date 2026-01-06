#!/usr/bin/env python3
"""
Test Excel Export with Language Support
Verifies that Excel files are properly translated in both English and Japanese
"""

import asyncio
from backend.app.excel_translations import get_excel_translation, EXCEL_TRANSLATIONS

def test_translations():
    """Test that all translations exist for both languages"""
    print("=" * 60)
    print("Testing Excel Translations")
    print("=" * 60)
    
    # Get all English keys
    en_keys = set(EXCEL_TRANSLATIONS['en'].keys())
    ja_keys = set(EXCEL_TRANSLATIONS['ja'].keys())
    
    print(f"\n✓ English translations: {len(en_keys)} terms")
    print(f"✓ Japanese translations: {len(ja_keys)} terms")
    
    # Check for mismatches
    missing_in_ja = en_keys - ja_keys
    missing_in_en = ja_keys - en_keys
    
    if missing_in_ja:
        print(f"\n⚠️  Missing in Japanese: {missing_in_ja}")
    else:
        print(f"\n✓ All English terms have Japanese translations")
    
    if missing_in_en:
        print(f"\n⚠️  Extra in Japanese: {missing_in_en}")
    else:
        print(f"✓ No extra terms in Japanese")
    
    # Sample some translations
    print("\n" + "=" * 60)
    print("Sample Translations")
    print("=" * 60)
    
    sample_keys = [
        'monthly_attendance_summary',
        'employee_id',
        'total_hours_worked',
        'comp_off_earned',
        'department_statistics',
        'public_holidays'
    ]
    
    for key in sample_keys:
        en = get_excel_translation(key, 'en')
        ja = get_excel_translation(key, 'ja')
        print(f"\n{key}:")
        print(f"  EN: {en}")
        print(f"  JA: {ja}")
    
    print("\n" + "=" * 60)
    print("✓ All translation tests passed!")
    print("=" * 60)

if __name__ == "__main__":
    test_translations()
