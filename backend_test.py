#!/usr/bin/env python3

import requests
import sys
from datetime import datetime
import json

class RailwayAPITester:
    def __init__(self, base_url="https://rail-collection.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success
            }

            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        json_response = response.json()
                        result["response_data"] = json_response
                        return success, json_response
                    except:
                        result["response_data"] = response.text
                        return success, response.text
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                result["error"] = response.text if response.text else "No error message"
                print(f"   Error: {result['error']}")

            self.test_results.append(result)
            return success, {}

        except Exception as e:
            result = {
                "test_name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "EXCEPTION",
                "success": False,
                "error": str(e)
            }
            self.test_results.append(result)
            print(f"❌ Failed - Exception: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("=" * 60)
        print("TESTING BASIC CONNECTIVITY")
        print("=" * 60)
        
        success, data = self.run_test("API Root Endpoint", "GET", "")
        if success:
            print(f"   API Response: {data}")

        return success

    def test_stats_endpoint(self):
        """Test stats endpoint for locomotive types and rolling stock types"""
        print("\n" + "=" * 60)
        print("TESTING STATISTICS ENDPOINT")
        print("=" * 60)
        
        success, data = self.run_test("Get Statistics", "GET", "stats")
        if success and data:
            print(f"   Total Locomotives: {data.get('total_locomotives', 0)}")
            print(f"   Total Rolling Stock: {data.get('total_rolling_stock', 0)}")
            print(f"   Locomotives by Type: {data.get('locomotives_by_type', {})}")
            print(f"   Rolling Stock by Type: {data.get('rolling_stock_by_type', {})}")
            
            # Verify required fields exist
            required_fields = ['total_locomotives', 'total_rolling_stock', 'locomotives_by_type', 'rolling_stock_by_type']
            for field in required_fields:
                if field not in data:
                    print(f"   ⚠️  Missing required field: {field}")
                    return False
            
            return True
        return success

    def test_locomotive_crud_with_types_and_prototipo(self):
        """Test locomotive CRUD operations with new locomotive_type field and Prototipo fields"""
        print("\n" + "=" * 60)
        print("TESTING LOCOMOTIVE CRUD WITH TYPES AND PROTOTIPO")
        print("=" * 60)
        
        # Test GET all locomotives
        success, locomotives = self.run_test("Get All Locomotives", "GET", "locomotives")
        if not success:
            return False

        # Test creating locomotive with locomotive_type and Prototipo fields
        locomotive_data = {
            "brand": "Test Brand",
            "model": "Test Electric Locomotive",
            "reference": "TEST-001",
            "locomotive_type": "electrica",
            # New Prototipo fields
            "paint_scheme": "Azul/Amarillo RENFE Test",
            "registration_number": "TEST-001-2",
            "prototype_type": "Locomotora Universal Test",
            "dcc_address": 1001,
            "condition": "nuevo",
            "decoder_brand": "ESU",
            "decoder_model": "LokSound 5",
            "price": 199.99,
            "notes": "Test locomotive with electric type and prototipo fields"
        }
        
        success, response = self.run_test("Create Locomotive with Type and Prototipo", "POST", "locomotives", 200, locomotive_data)
        if not success:
            return False
        
        locomotive_id = response.get('id')
        if not locomotive_id:
            print("❌ No locomotive ID returned in create response")
            return False
        
        print(f"   Created locomotive ID: {locomotive_id}")
        
        # Test GET single locomotive and verify Prototipo fields
        success, locomotive = self.run_test("Get Single Locomotive", "GET", f"locomotives/{locomotive_id}")
        if success:
            print(f"   Locomotive Type: {locomotive.get('locomotive_type', 'NOT SET')}")
            print(f"   Paint Scheme: {locomotive.get('paint_scheme', 'NOT SET')}")
            print(f"   Registration Number: {locomotive.get('registration_number', 'NOT SET')}")
            print(f"   Prototype Type: {locomotive.get('prototype_type', 'NOT SET')}")
            
            if locomotive.get('locomotive_type') != 'electrica':
                print(f"   ⚠️  Wrong locomotive type: expected 'electrica', got '{locomotive.get('locomotive_type')}'")
            
            # Verify Prototipo fields
            expected_prototipo = {
                'paint_scheme': 'Azul/Amarillo RENFE Test',
                'registration_number': 'TEST-001-2',
                'prototype_type': 'Locomotora Universal Test'
            }
            
            prototipo_success = True
            for field, expected_value in expected_prototipo.items():
                actual_value = locomotive.get(field)
                if actual_value != expected_value:
                    print(f"   ⚠️  Wrong {field}: expected '{expected_value}', got '{actual_value}'")
                    prototipo_success = False
            
            if prototipo_success:
                print("   ✅ All Prototipo fields correctly saved")
        
        # Test updating locomotive with different type
        update_data = locomotive_data.copy()
        update_data['locomotive_type'] = 'diesel'
        update_data['model'] = 'Test Diesel Locomotive'
        
        success, _ = self.run_test("Update Locomotive Type", "PUT", f"locomotives/{locomotive_id}", 200, update_data)
        if success:
            # Verify the update worked
            success, updated_loco = self.run_test("Verify Updated Locomotive", "GET", f"locomotives/{locomotive_id}")
            if success and updated_loco.get('locomotive_type') == 'diesel':
                print(f"   ✅ Locomotive type updated successfully to: {updated_loco.get('locomotive_type')}")
            else:
                print(f"   ❌ Locomotive type not updated correctly")
                success = False
        
        # Test different locomotive types
        types_to_test = ['vapor', 'automotor', 'alta_velocidad', 'otro']
        for loco_type in types_to_test:
            test_data = locomotive_data.copy()
            test_data['locomotive_type'] = loco_type
            test_data['model'] = f'Test {loco_type.title()} Locomotive'
            test_data['reference'] = f'TEST-{loco_type.upper()}'
            test_data['dcc_address'] = 2000 + len(loco_type)
            
            success, response = self.run_test(f"Create {loco_type.title()} Locomotive", "POST", "locomotives", 200, test_data)
            if success and response.get('id'):
                # Clean up
                self.run_test(f"Delete {loco_type.title()} Locomotive", "DELETE", f"locomotives/{response.get('id')}", 200)
        
        # Test DELETE
        success, _ = self.run_test("Delete Test Locomotive", "DELETE", f"locomotives/{locomotive_id}", 200)
        
        return success

    def test_rolling_stock_crud(self):
        """Test rolling stock CRUD operations"""
        print("\n" + "=" * 60)
        print("TESTING ROLLING STOCK CRUD")
        print("=" * 60)
        
        # Test GET all rolling stock
        success, stock_list = self.run_test("Get All Rolling Stock", "GET", "rolling-stock")
        if not success:
            return False
        
        print(f"   Found {len(stock_list)} rolling stock items")
        
        # Test creating rolling stock
        stock_data = {
            "brand": "Roco",
            "model": "Test Talgo Coach",
            "reference": "TEST-COACH-001",
            "stock_type": "coche_viajeros",
            "condition": "nuevo",
            "era": "VI",
            "railway_company": "RENFE",
            "price": 45.90,
            "notes": "Test coach for rolling stock functionality"
        }
        
        success, response = self.run_test("Create Rolling Stock", "POST", "rolling-stock", 200, stock_data)
        if not success:
            return False
        
        stock_id = response.get('id')
        if not stock_id:
            print("❌ No rolling stock ID returned in create response")
            return False
        
        print(f"   Created rolling stock ID: {stock_id}")
        
        # Test GET single rolling stock
        success, stock_item = self.run_test("Get Single Rolling Stock", "GET", f"rolling-stock/{stock_id}")
        if success:
            print(f"   Stock Type: {stock_item.get('stock_type', 'NOT SET')}")
            print(f"   Railway Company: {stock_item.get('railway_company', 'NOT SET')}")
        
        # Test updating rolling stock
        update_data = stock_data.copy()
        update_data['stock_type'] = 'vagon_mercancias'
        update_data['model'] = 'Test Freight Wagon'
        
        success, _ = self.run_test("Update Rolling Stock", "PUT", f"rolling-stock/{stock_id}", 200, update_data)
        if success:
            # Verify the update worked
            success, updated_stock = self.run_test("Verify Updated Rolling Stock", "GET", f"rolling-stock/{stock_id}")
            if success and updated_stock.get('stock_type') == 'vagon_mercancias':
                print(f"   ✅ Stock type updated successfully to: {updated_stock.get('stock_type')}")
            else:
                print(f"   ❌ Stock type not updated correctly")
                success = False
        
        # Test different stock types
        types_to_test = ['furgon', 'otro']
        for stock_type in types_to_test:
            test_data = stock_data.copy()
            test_data['stock_type'] = stock_type
            test_data['model'] = f'Test {stock_type.title()}'
            test_data['reference'] = f'TEST-{stock_type.upper()}'
            
            success, response = self.run_test(f"Create {stock_type.title()} Stock", "POST", "rolling-stock", 200, test_data)
            if success and response.get('id'):
                # Clean up
                self.run_test(f"Delete {stock_type.title()} Stock", "DELETE", f"rolling-stock/{response.get('id')}", 200)
        
        # Test DELETE
        success, _ = self.run_test("Delete Test Rolling Stock", "DELETE", f"rolling-stock/{stock_id}", 200)
        
        return success

    def test_error_handling(self):
        """Test error handling for non-existent resources"""
        print("\n" + "=" * 60)
        print("TESTING ERROR HANDLING")
        print("=" * 60)
        
        # Test 404 responses
        tests = [
            ("Get Non-existent Locomotive", "GET", "locomotives/non-existent-id", 404),
            ("Get Non-existent Rolling Stock", "GET", "rolling-stock/non-existent-id", 404),
            ("Update Non-existent Locomotive", "PUT", "locomotives/non-existent-id", 404, {"brand": "test"}),
            ("Update Non-existent Rolling Stock", "PUT", "rolling-stock/non-existent-id", 404, {"brand": "test"}),
            ("Delete Non-existent Locomotive", "DELETE", "locomotives/non-existent-id", 404),
            ("Delete Non-existent Rolling Stock", "DELETE", "rolling-stock/non-existent-id", 404)
        ]
        
        all_success = True
        for test_name, method, endpoint, expected_status, *data in tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status, data[0] if data else None)
            if not success:
                all_success = False
        
        return all_success

    def test_backup_restore_endpoints(self):
        """Test backup and restore functionality"""
        print("\n" + "=" * 60)
        print("TESTING BACKUP/RESTORE ENDPOINTS")
        print("=" * 60)
        
        # First, create some test data to backup
        test_locomotive = {
            "brand": "Electrotren",
            "model": "252",
            "reference": "E252-TEST",
            "locomotive_type": "electrica",
            "paint_scheme": "Azul/Amarillo RENFE",
            "registration_number": "252-001-2",
            "prototype_type": "Locomotora Universal",
            "dcc_address": 2520,
            "condition": "nuevo",
            "price": 150.00,
            "notes": "Test locomotive for backup/restore"
        }
        
        # Create test locomotive
        success, loco_response = self.run_test("Create Test Locomotive for Backup", "POST", "locomotives", 200, test_locomotive)
        if not success:
            return False
        
        locomotive_id = loco_response.get('id')
        print(f"   Created test locomotive ID: {locomotive_id}")
        
        # Test GET backup endpoint
        success, backup_data = self.run_test("Create Backup", "GET", "backup", 200)
        if not success:
            print("❌ Backup endpoint failed")
            return False
        
        # Verify backup structure
        required_backup_fields = ['version', 'created_at', 'locomotives', 'rolling_stock', 'decoders', 'sound_projects']
        backup_valid = True
        
        for field in required_backup_fields:
            if field not in backup_data:
                print(f"   ❌ Missing required backup field: {field}")
                backup_valid = False
            else:
                print(f"   ✅ Backup field '{field}': {type(backup_data[field]).__name__}")
        
        if not backup_valid:
            return False
        
        # Verify our test locomotive is in the backup
        test_loco_in_backup = any(loco.get('id') == locomotive_id for loco in backup_data['locomotives'])
        if test_loco_in_backup:
            print(f"   ✅ Test locomotive found in backup")
        else:
            print(f"   ❌ Test locomotive not found in backup")
            return False
        
        # Test backup data counts
        print(f"   Backup contains:")
        print(f"     - {len(backup_data['locomotives'])} locomotives")
        print(f"     - {len(backup_data['rolling_stock'])} rolling stock items")
        print(f"     - {len(backup_data['decoders'])} decoders")
        print(f"     - {len(backup_data['sound_projects'])} sound projects")
        
        # Test restore endpoint with the backup data
        success, restore_response = self.run_test("Restore Backup", "POST", "restore", 200, backup_data)
        if not success:
            print("❌ Restore endpoint failed")
            return False
        
        # Verify restore response structure
        if 'restored' in restore_response:
            restored_counts = restore_response['restored']
            print(f"   ✅ Restore completed:")
            print(f"     - {restored_counts.get('locomotives', 0)} locomotives restored")
            print(f"     - {restored_counts.get('rolling_stock', 0)} rolling stock restored")
            print(f"     - {restored_counts.get('decoders', 0)} decoders restored")
            print(f"     - {restored_counts.get('sound_projects', 0)} sound projects restored")
        else:
            print("   ⚠️  Restore response missing 'restored' field")
        
        # Verify data still exists after restore
        success, post_restore_locomotive = self.run_test("Verify Locomotive After Restore", "GET", f"locomotives/{locomotive_id}")
        if success:
            print("   ✅ Locomotive still exists after restore")
            
            # Check prototipo fields are preserved
            prototipo_fields = ['paint_scheme', 'registration_number', 'prototype_type']
            for field in prototipo_fields:
                value = post_restore_locomotive.get(field)
                if value:
                    print(f"     {field}: {value}")
                    
        # Clean up test locomotive
        self.run_test("Delete Test Locomotive", "DELETE", f"locomotives/{locomotive_id}", 200)
        
        return True

    def test_backup_history_and_settings(self):
        """Test backup history and reminder settings functionality"""
        print("\n" + "=" * 60)
        print("TESTING BACKUP HISTORY AND SETTINGS")
        print("=" * 60)
        
        # Test GET backup history (should be empty initially after clearing)
        success, history_before = self.run_test("Get Backup History", "GET", "backup/history", 200)
        if not success:
            return False
        
        print(f"   Initial history entries: {len(history_before)}")
        
        # Test backup settings GET (should return defaults)
        success, settings = self.run_test("Get Backup Settings", "GET", "backup/settings", 200)
        if not success:
            return False
        
        # Verify default settings structure
        expected_settings_fields = ['reminder_enabled', 'reminder_frequency', 'last_reminder_shown']
        settings_valid = True
        
        for field in expected_settings_fields:
            if field not in settings:
                print(f"   ❌ Missing settings field: {field}")
                settings_valid = False
            else:
                print(f"   ✅ Settings field '{field}': {settings[field]}")
        
        if not settings_valid:
            return False
        
        # Test updating backup settings
        new_settings = {
            "reminder_enabled": True,
            "reminder_frequency": "daily",
            "last_reminder_shown": None
        }
        
        success, saved_settings = self.run_test("Save Backup Settings", "POST", "backup/settings", 200, new_settings)
        if not success:
            return False
        
        # Verify settings were saved correctly
        if (saved_settings.get('reminder_enabled') == True and 
            saved_settings.get('reminder_frequency') == 'daily'):
            print(f"   ✅ Settings saved correctly")
        else:
            print(f"   ❌ Settings not saved correctly")
            return False
        
        # Test different frequencies
        frequencies = ['weekly', 'monthly']
        for freq in frequencies:
            test_settings = {
                "reminder_enabled": True,
                "reminder_frequency": freq,
                "last_reminder_shown": None
            }
            
            success, _ = self.run_test(f"Save {freq.title()} Frequency", "POST", "backup/settings", 200, test_settings)
            if not success:
                return False
        
        # Create a backup to test history functionality
        success, backup_data = self.run_test("Create Backup for History", "GET", "backup", 200)
        if not success:
            return False
        
        # Test GET backup history after creating backup
        success, history_after = self.run_test("Get Backup History After Backup", "GET", "backup/history", 200)
        if not success:
            return False
        
        print(f"   History entries after backup: {len(history_after)}")
        
        if len(history_after) > len(history_before):
            print("   ✅ Backup added to history successfully")
            
            # Verify history entry structure
            latest_entry = history_after[0]  # Should be sorted by created_at desc
            required_history_fields = ['id', 'created_at', 'type', 'locomotives_count', 'rolling_stock_count', 'decoders_count', 'sound_projects_count']
            
            history_entry_valid = True
            for field in required_history_fields:
                if field not in latest_entry:
                    print(f"   ❌ Missing history field: {field}")
                    history_entry_valid = False
                else:
                    print(f"   ✅ History field '{field}': {latest_entry[field]}")
            
            if not history_entry_valid:
                return False
                
            # Verify the counts match what we expect
            expected_counts = {
                'locomotives_count': len(backup_data['locomotives']),
                'rolling_stock_count': len(backup_data['rolling_stock']),
                'decoders_count': len(backup_data['decoders']),
                'sound_projects_count': len(backup_data['sound_projects'])
            }
            
            counts_match = True
            for field, expected_value in expected_counts.items():
                actual_value = latest_entry.get(field)
                if actual_value != expected_value:
                    print(f"   ❌ Wrong {field}: expected {expected_value}, got {actual_value}")
                    counts_match = False
                    
            if counts_match:
                print("   ✅ All backup counts in history are correct")
            else:
                return False
        else:
            print("   ❌ Backup was not added to history")
            return False
        
        # Test DELETE backup history
        success, _ = self.run_test("Clear Backup History", "DELETE", "backup/history", 200)
        if not success:
            return False
        
        # Verify history is cleared
        success, history_cleared = self.run_test("Verify History Cleared", "GET", "backup/history", 200)
        if success and len(history_cleared) == 0:
            print("   ✅ Backup history cleared successfully")
        else:
            print(f"   ❌ History not cleared, still has {len(history_cleared)} entries")
            return False
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🚂 STARTING RAILWAY COLLECTION API TESTS")
        print("=" * 80)
        
        test_suites = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Statistics Endpoint", self.test_stats_endpoint),
            ("Locomotive CRUD with Types and Prototipo", self.test_locomotive_crud_with_types_and_prototipo),
            ("Rolling Stock CRUD", self.test_rolling_stock_crud),
            ("Backup/Restore Endpoints", self.test_backup_restore_endpoints),
            ("Error Handling", self.test_error_handling)
        ]
        
        suite_results = []
        for suite_name, test_func in test_suites:
            try:
                result = test_func()
                suite_results.append((suite_name, result))
                print(f"\n📊 {suite_name}: {'✅ PASSED' if result else '❌ FAILED'}")
            except Exception as e:
                suite_results.append((suite_name, False))
                print(f"\n📊 {suite_name}: ❌ FAILED (Exception: {e})")
        
        # Final Results
        print("\n" + "=" * 80)
        print("🏁 FINAL TEST RESULTS")
        print("=" * 80)
        
        total_suites = len(suite_results)
        passed_suites = sum(1 for _, result in suite_results if result)
        
        for suite_name, result in suite_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"   {suite_name}: {status}")
        
        print(f"\n📊 Overall Results:")
        print(f"   Test Suites: {passed_suites}/{total_suites} passed")
        print(f"   Individual Tests: {self.tests_passed}/{self.tests_run} passed")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return passed_suites == total_suites

def main():
    tester = RailwayAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())