#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class RailwayCollectionAPITester:
    def __init__(self, base_url="https://rail-collection.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name, success, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def test_root_endpoint(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/")
            success = response.status_code == 200
            self.log_test("Root endpoint", success, 
                         f"Status: {response.status_code}" if not success else None)
            return success
        except Exception as e:
            self.log_test("Root endpoint", False, f"Connection error: {str(e)}")
            return False

    def test_stats_endpoint(self):
        """Test statistics endpoint"""
        try:
            response = requests.get(f"{self.base_url}/stats")
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ['total_locomotives', 'total_decoders', 'total_sound_projects', 'total_value']
                for field in required_fields:
                    if field not in data:
                        success = False
                        self.log_test("Stats endpoint structure", False, f"Missing field: {field}")
                        return False
            self.log_test("Stats endpoint", success, 
                         f"Status: {response.status_code}" if not success else None)
            return success
        except Exception as e:
            self.log_test("Stats endpoint", False, f"Error: {str(e)}")
            return False

    def test_locomotives_crud(self):
        """Test locomotives CRUD operations"""
        # Test GET locomotives
        try:
            response = requests.get(f"{self.base_url}/locomotives")
            success = response.status_code == 200
            self.log_test("GET locomotives", success, 
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            existing_locomotives = response.json()
            print(f"   Found {len(existing_locomotives)} existing locomotives")
            
            # Test CREATE locomotive
            test_locomotive = {
                "brand": "Test Brand",
                "model": "Test Model", 
                "reference": "TEST001",
                "dcc_address": 99,
                "decoder_brand": "ESU",
                "decoder_model": "LokSound Test",
                "condition": "nuevo",
                "price": 150.00,
                "functions": [
                    {
                        "function_number": "F0",
                        "description": "Test headlight",
                        "is_sound": False
                    }
                ],
                "cv_modifications": [
                    {
                        "cv_number": 3,
                        "value": 10,
                        "description": "Test CV modification"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/locomotives", json=test_locomotive)
            success = response.status_code == 200
            self.log_test("POST locomotive", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            created_loco = response.json()
            loco_id = created_loco.get('id')
            
            if not loco_id:
                self.log_test("POST locomotive ID", False, "No ID returned")
                return False
            
            # Test GET specific locomotive
            response = requests.get(f"{self.base_url}/locomotives/{loco_id}")
            success = response.status_code == 200
            self.log_test("GET specific locomotive", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test UPDATE locomotive
            update_data = test_locomotive.copy()
            update_data["brand"] = "Updated Brand"
            update_data["price"] = 200.00
            
            response = requests.put(f"{self.base_url}/locomotives/{loco_id}", json=update_data)
            success = response.status_code == 200
            self.log_test("PUT locomotive", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test DELETE locomotive
            response = requests.delete(f"{self.base_url}/locomotives/{loco_id}")
            success = response.status_code == 200
            self.log_test("DELETE locomotive", success,
                         f"Status: {response.status_code}" if not success else None)
            
            return success
            
        except Exception as e:
            self.log_test("Locomotives CRUD", False, f"Error: {str(e)}")
            return False

    def test_decoders_crud(self):
        """Test decoders CRUD operations"""
        try:
            # Test GET decoders
            response = requests.get(f"{self.base_url}/decoders")
            success = response.status_code == 200
            self.log_test("GET decoders", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            existing_decoders = response.json()
            print(f"   Found {len(existing_decoders)} existing decoders")
            
            # Test CREATE decoder
            test_decoder = {
                "brand": "Test Decoder Brand",
                "model": "Test Model",
                "type": "sound", 
                "scale": "N",
                "interface": "NEM651",
                "sound_capable": True,
                "max_functions": 28,
                "notes": "Test decoder notes"
            }
            
            response = requests.post(f"{self.base_url}/decoders", json=test_decoder)
            success = response.status_code == 200
            self.log_test("POST decoder", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            created_decoder = response.json()
            decoder_id = created_decoder.get('id')
            
            if not decoder_id:
                self.log_test("POST decoder ID", False, "No ID returned")
                return False
            
            # Test GET specific decoder  
            response = requests.get(f"{self.base_url}/decoders/{decoder_id}")
            success = response.status_code == 200
            self.log_test("GET specific decoder", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test UPDATE decoder
            update_data = test_decoder.copy()
            update_data["brand"] = "Updated Decoder Brand"
            
            response = requests.put(f"{self.base_url}/decoders/{decoder_id}", json=update_data)
            success = response.status_code == 200
            self.log_test("PUT decoder", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test DELETE decoder
            response = requests.delete(f"{self.base_url}/decoders/{decoder_id}")
            success = response.status_code == 200
            self.log_test("DELETE decoder", success,
                         f"Status: {response.status_code}" if not success else None)
            
            return success
            
        except Exception as e:
            self.log_test("Decoders CRUD", False, f"Error: {str(e)}")
            return False

    def test_sound_projects_crud(self):
        """Test sound projects CRUD operations"""
        try:
            # Test GET sound projects
            response = requests.get(f"{self.base_url}/sound-projects")
            success = response.status_code == 200
            self.log_test("GET sound projects", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            existing_projects = response.json()
            print(f"   Found {len(existing_projects)} existing sound projects")
            
            # Test CREATE sound project
            test_project = {
                "name": "Test Sound Project",
                "decoder_brand": "ESU",
                "decoder_model": "LokSound Test",
                "locomotive_type": "Test Locomotive",
                "version": "1.0",
                "sounds": ["horn", "bell", "motor"],
                "notes": "Test sound project notes"
            }
            
            response = requests.post(f"{self.base_url}/sound-projects", json=test_project)
            success = response.status_code == 200
            self.log_test("POST sound project", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            created_project = response.json()
            project_id = created_project.get('id')
            
            if not project_id:
                self.log_test("POST sound project ID", False, "No ID returned")
                return False
            
            # Test GET specific sound project
            response = requests.get(f"{self.base_url}/sound-projects/{project_id}")
            success = response.status_code == 200
            self.log_test("GET specific sound project", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test UPDATE sound project
            update_data = test_project.copy()
            update_data["name"] = "Updated Sound Project"
            update_data["sounds"] = ["updated_horn", "updated_bell"]
            
            response = requests.put(f"{self.base_url}/sound-projects/{project_id}", json=update_data)
            success = response.status_code == 200
            self.log_test("PUT sound project", success,
                         f"Status: {response.status_code}" if not success else None)
            if not success:
                return False
            
            # Test DELETE sound project
            response = requests.delete(f"{self.base_url}/sound-projects/{project_id}")
            success = response.status_code == 200
            self.log_test("DELETE sound project", success,
                         f"Status: {response.status_code}" if not success else None)
            
            return success
            
        except Exception as e:
            self.log_test("Sound Projects CRUD", False, f"Error: {str(e)}")
            return False

    def test_error_handling(self):
        """Test API error handling"""
        try:
            # Test 404 for non-existent locomotive
            response = requests.get(f"{self.base_url}/locomotives/nonexistent-id")
            success = response.status_code == 404
            self.log_test("404 handling for locomotives", success,
                         f"Expected 404, got {response.status_code}" if not success else None)
            
            # Test 404 for non-existent decoder  
            response = requests.get(f"{self.base_url}/decoders/nonexistent-id")
            success = response.status_code == 404
            self.log_test("404 handling for decoders", success,
                         f"Expected 404, got {response.status_code}" if not success else None)
            
            # Test 404 for non-existent sound project
            response = requests.get(f"{self.base_url}/sound-projects/nonexistent-id")
            success = response.status_code == 404
            self.log_test("404 handling for sound projects", success,
                         f"Expected 404, got {response.status_code}" if not success else None)
            
            return True
            
        except Exception as e:
            self.log_test("Error handling", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests and return results"""
        print("🧪 Starting Railway Collection API Tests...")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_root_endpoint():
            print("❌ Cannot connect to API - stopping tests")
            return False
        
        # Core functionality tests
        self.test_stats_endpoint()
        self.test_locomotives_crud()
        self.test_decoders_crud() 
        self.test_sound_projects_crud()
        self.test_error_handling()
        
        # Results
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = RailwayCollectionAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())