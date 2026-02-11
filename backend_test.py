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

    def run_all_tests(self):
        """Run all test suites"""
        print("🚂 STARTING RAILWAY COLLECTION API TESTS")
        print("=" * 80)
        
        test_suites = [
            ("Basic Connectivity", self.test_basic_connectivity),
            ("Statistics Endpoint", self.test_stats_endpoint),
            ("Locomotive CRUD with Types", self.test_locomotive_crud_with_types),
            ("Rolling Stock CRUD", self.test_rolling_stock_crud),
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