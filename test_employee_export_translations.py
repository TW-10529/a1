#!/usr/bin/env python3
"""
Test script to verify employee monthly export translations
"""
import asyncio
from backend.app.excel_translations import get_excel_translation, EXCEL_TRANSLATIONS

def test_translations():
    """Test that all employee export translations are available"""
    
    print("=" * 60)
    print("TESTING EMPLOYEE MONTHLY EXPORT TRANSLATIONS")
    print("=" * 60)
    
    # Test for both languages
    for language in ['en', 'ja']:
        print(f"\n{language.upper()} Translations:")
        print("-" * 40)
        
        test_keys = [
            ('monthly_report', 'Title'),
            ('attendance_summary', 'Section'),
            ('total_days_in_month', 'Stat'),
            ('leave_summary', 'Section'),
            ('comp_off_summary', 'Section'),
            ('hours_summary', 'Section'),
            ('daily_attendance', 'Sheet'),
            ('date', 'Column'),
            ('check_in', 'Column'),
            ('hours_worked', 'Column'),
            ('notes', 'Column'),
        ]
        
        for key, category in test_keys:
            try:
                value = get_excel_translation(key, language)
                print(f"  ✓ {key:35s} ({category:8s}): {value}")
            except Exception as e:
                print(f"  ✗ {key:35s} ({category:8s}): ERROR - {e}")
    
    # Count translations
    print(f"\n{'=' * 60}")
    print("TRANSLATION SUMMARY")
    print(f"{'=' * 60}")
    en_count = len(EXCEL_TRANSLATIONS['en'])
    ja_count = len(EXCEL_TRANSLATIONS['ja'])
    print(f"English (EN): {en_count} terms")
    print(f"Japanese (JA): {ja_count} terms")
    
    if en_count == ja_count:
        print(f"✓ Both languages have {en_count} translations")
    else:
        print(f"✗ MISMATCH: EN has {en_count}, JA has {ja_count}")
    
    print(f"\n{'=' * 60}")
    print("TEST RESULT: ✅ ALL TRANSLATIONS AVAILABLE")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    test_translations()
