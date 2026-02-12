"""
Test suite for Compositions CRUD and CSV Import features.
Tests the following features:
- Compositions CRUD (Create, Read, Update, Delete)
- Composition with locomotive and wagons
- Wagon ordering/reordering
- CSV Import for locomotives
- CSV Import for rolling stock
- CSV template download
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCompositionsCRUD:
    """Test Compositions CRUD operations"""
    
    def test_get_all_compositions(self):
        """Test listing all compositions"""
        response = requests.get(f"{BASE_URL}/api/compositions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/compositions - Found {len(data)} compositions")
    
    def test_create_composition_basic(self):
        """Test creating a basic composition"""
        composition_data = {
            "name": f"TEST_Composition_{uuid.uuid4().hex[:8]}",
            "service_type": "pasajeros",
            "era": "V",
            "notes": "Test composition created by pytest"
        }
        response = requests.post(f"{BASE_URL}/api/compositions", json=composition_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == composition_data["name"]
        assert data["service_type"] == composition_data["service_type"]
        assert data["era"] == composition_data["era"]
        print(f"✅ POST /api/compositions - Created composition: {data['name']}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/compositions/{data['id']}")
    
    def test_create_composition_with_locomotive(self):
        """Test creating a composition with a locomotive"""
        # First get available locomotives
        locos_response = requests.get(f"{BASE_URL}/api/locomotives")
        assert locos_response.status_code == 200
        locos = locos_response.json()
        
        if len(locos) == 0:
            pytest.skip("No locomotives available for testing")
        
        loco_id = locos[0]["id"]
        
        composition_data = {
            "name": f"TEST_CompWithLoco_{uuid.uuid4().hex[:8]}",
            "service_type": "pasajeros",
            "era": "V",
            "locomotive_id": loco_id,
            "wagons": [],
            "notes": "Test composition with locomotive"
        }
        response = requests.post(f"{BASE_URL}/api/compositions", json=composition_data)
        assert response.status_code == 200
        data = response.json()
        assert data["locomotive_id"] == loco_id
        print(f"✅ Created composition with locomotive ID: {loco_id}")
        
        # Verify GET returns locomotive details
        get_response = requests.get(f"{BASE_URL}/api/compositions/{data['id']}")
        assert get_response.status_code == 200
        detail = get_response.json()
        assert detail["locomotive_id"] == loco_id
        assert detail.get("locomotive_details") is not None
        print(f"✅ GET composition detail includes locomotive_details")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/compositions/{data['id']}")
    
    def test_create_composition_with_wagons(self):
        """Test creating a composition with ordered wagons"""
        # Get available rolling stock
        stock_response = requests.get(f"{BASE_URL}/api/rolling-stock")
        assert stock_response.status_code == 200
        stock = stock_response.json()
        
        if len(stock) == 0:
            pytest.skip("No rolling stock available for testing")
        
        wagon_id = stock[0]["id"]
        
        composition_data = {
            "name": f"TEST_CompWithWagons_{uuid.uuid4().hex[:8]}",
            "service_type": "mercancias",
            "wagons": [
                {"wagon_id": wagon_id, "position": 1}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/compositions", json=composition_data)
        assert response.status_code == 200
        data = response.json()
        assert len(data["wagons"]) == 1
        assert data["wagons"][0]["wagon_id"] == wagon_id
        assert data["wagons"][0]["position"] == 1
        print(f"✅ Created composition with wagon at position 1")
        
        # Verify GET returns wagon details
        get_response = requests.get(f"{BASE_URL}/api/compositions/{data['id']}")
        assert get_response.status_code == 200
        detail = get_response.json()
        assert len(detail.get("wagons_details", [])) == 1
        print(f"✅ GET composition detail includes wagons_details")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/compositions/{data['id']}")
    
    def test_update_composition(self):
        """Test updating a composition"""
        # Create a composition first
        composition_data = {
            "name": f"TEST_UpdateComp_{uuid.uuid4().hex[:8]}",
            "service_type": "pasajeros"
        }
        create_response = requests.post(f"{BASE_URL}/api/compositions", json=composition_data)
        assert create_response.status_code == 200
        comp_id = create_response.json()["id"]
        
        # Update the composition
        update_data = {
            "name": f"TEST_UpdatedComp_{uuid.uuid4().hex[:8]}",
            "service_type": "mercancias",
            "era": "VI",
            "notes": "Updated via pytest"
        }
        update_response = requests.put(f"{BASE_URL}/api/compositions/{comp_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["service_type"] == "mercancias"
        assert updated["era"] == "VI"
        print(f"✅ PUT /api/compositions/{comp_id} - Updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/compositions/{comp_id}")
    
    def test_delete_composition(self):
        """Test deleting a composition"""
        # Create a composition first
        composition_data = {
            "name": f"TEST_DeleteComp_{uuid.uuid4().hex[:8]}",
            "service_type": "mixto"
        }
        create_response = requests.post(f"{BASE_URL}/api/compositions", json=composition_data)
        assert create_response.status_code == 200
        comp_id = create_response.json()["id"]
        
        # Delete the composition
        delete_response = requests.delete(f"{BASE_URL}/api/compositions/{comp_id}")
        assert delete_response.status_code == 200
        print(f"✅ DELETE /api/compositions/{comp_id} - Deleted successfully")
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/compositions/{comp_id}")
        assert get_response.status_code == 404
        print(f"✅ Verified composition no longer exists")
    
    def test_get_composition_not_found(self):
        """Test getting a non-existent composition returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/compositions/{fake_id}")
        assert response.status_code == 404
        print(f"✅ GET /api/compositions/{fake_id} - Returns 404 as expected")


class TestCSVImportLocomotives:
    """Test CSV Import for Locomotives"""
    
    def test_get_locomotives_csv_template(self):
        """Test downloading locomotives CSV template"""
        response = requests.get(f"{BASE_URL}/api/import/csv/template/locomotives")
        assert response.status_code == 200
        content = response.text
        assert "brand" in content
        assert "model" in content
        assert "reference" in content
        assert "dcc_address" in content
        print(f"✅ GET /api/import/csv/template/locomotives - Template contains required columns")
    
    def test_import_locomotives_csv_success(self):
        """Test importing valid locomotive CSV"""
        csv_content = """brand,model,reference,locomotive_type,dcc_address,decoder_brand,decoder_model,condition,era,railway_company,purchase_date,price,registration_number,notes
TEST_Brand,TEST_Model_CSV,TEST_REF_001,electrica,99,ESU,LokSound,nuevo,V,RENFE,2024-01-15,199.99,TEST-001,Test import via pytest
TEST_Brand2,TEST_Model_CSV2,TEST_REF_002,diesel,98,Lenz,Standard+,nuevo,VI,Renfe Operadora,2024-02-20,149.99,TEST-002,Second test import"""
        
        response = requests.post(
            f"{BASE_URL}/api/import/csv/locomotives",
            data=csv_content,
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["imported_count"] == 2
        assert data["skipped_count"] == 0
        assert len(data["imported_items"]) == 2
        print(f"✅ POST /api/import/csv/locomotives - Imported 2 locomotives successfully")
        
        # Cleanup - delete test locomotives
        locos = requests.get(f"{BASE_URL}/api/locomotives").json()
        for loco in locos:
            if loco.get("reference", "").startswith("TEST_REF_"):
                requests.delete(f"{BASE_URL}/api/locomotives/{loco['id']}")
        print(f"✅ Cleanup completed")
    
    def test_import_locomotives_csv_missing_required_fields(self):
        """Test importing CSV with missing required fields"""
        # Missing dcc_address on row 2
        csv_content = """brand,model,reference,dcc_address
TEST_Brand,TEST_Model,TEST_REF_003,
TEST_Brand2,TEST_Model2,TEST_REF_004,55"""
        
        response = requests.post(
            f"{BASE_URL}/api/import/csv/locomotives",
            data=csv_content,
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should skip the first row with empty dcc_address
        assert data["skipped_count"] >= 1
        assert len(data["errors"]) >= 1
        print(f"✅ CSV import handles missing required fields - {data['skipped_count']} skipped, {len(data['errors'])} errors")
        
        # Cleanup
        locos = requests.get(f"{BASE_URL}/api/locomotives").json()
        for loco in locos:
            if loco.get("reference", "").startswith("TEST_REF_"):
                requests.delete(f"{BASE_URL}/api/locomotives/{loco['id']}")


class TestCSVImportRollingStock:
    """Test CSV Import for Rolling Stock"""
    
    def test_get_rolling_stock_csv_template(self):
        """Test downloading rolling stock CSV template"""
        response = requests.get(f"{BASE_URL}/api/import/csv/template/rolling-stock")
        assert response.status_code == 200
        content = response.text
        assert "brand" in content
        assert "model" in content
        assert "reference" in content
        assert "stock_type" in content
        print(f"✅ GET /api/import/csv/template/rolling-stock - Template contains required columns")
    
    def test_import_rolling_stock_csv_success(self):
        """Test importing valid rolling stock CSV"""
        csv_content = """brand,model,reference,stock_type,condition,era,railway_company,purchase_date,price,notes
TEST_Roco,TEST_Talgo_CSV,TEST_STOCK_001,coche_viajeros,nuevo,V,RENFE,2024-01-10,45.99,Test wagon import
TEST_Arnold,TEST_Vagon_CSV,TEST_STOCK_002,vagon_mercancias,nuevo,IV,RENFE,2024-03-05,32.50,Second test wagon"""
        
        response = requests.post(
            f"{BASE_URL}/api/import/csv/rolling-stock",
            data=csv_content,
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["imported_count"] == 2
        assert len(data["imported_items"]) == 2
        print(f"✅ POST /api/import/csv/rolling-stock - Imported 2 items successfully")
        
        # Cleanup
        stock = requests.get(f"{BASE_URL}/api/rolling-stock").json()
        for item in stock:
            if item.get("reference", "").startswith("TEST_STOCK_"):
                requests.delete(f"{BASE_URL}/api/rolling-stock/{item['id']}")
        print(f"✅ Cleanup completed")
    
    def test_import_rolling_stock_csv_missing_required_fields(self):
        """Test importing CSV with missing required fields"""
        # Missing reference
        csv_content = """brand,model,reference,stock_type
TEST_Brand,TEST_Model,,vagon_mercancias
TEST_Brand2,TEST_Model2,TEST_STOCK_003,coche_viajeros"""
        
        response = requests.post(
            f"{BASE_URL}/api/import/csv/rolling-stock",
            data=csv_content,
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should skip row with empty reference
        assert data["skipped_count"] >= 1
        assert len(data["errors"]) >= 1
        print(f"✅ CSV import handles missing required fields - {data['skipped_count']} skipped")
        
        # Cleanup
        stock = requests.get(f"{BASE_URL}/api/rolling-stock").json()
        for item in stock:
            if item.get("reference", "").startswith("TEST_STOCK_"):
                requests.delete(f"{BASE_URL}/api/rolling-stock/{item['id']}")


class TestStatsWithCompositions:
    """Test stats include composition count"""
    
    def test_stats_include_compositions(self):
        """Test that stats endpoint includes total_compositions"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_compositions" in data
        assert isinstance(data["total_compositions"], int)
        print(f"✅ GET /api/stats - total_compositions: {data['total_compositions']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
