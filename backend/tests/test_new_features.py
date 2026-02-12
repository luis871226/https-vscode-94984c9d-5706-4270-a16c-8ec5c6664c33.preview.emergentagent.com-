"""
Test file for new features:
1. Wishlist CRUD operations
2. PDF Export endpoints
3. Move wishlist to collection
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://rail-catalog.preview.emergentagent.com').rstrip('/')


class TestWishlistCRUD:
    """Test Wishlist CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup_cleanup(self, request):
        """Setup and cleanup test data"""
        self.created_ids = []
        yield
        # Cleanup: Delete all test-created wishlist items
        for item_id in self.created_ids:
            try:
                requests.delete(f"{BASE_URL}/api/wishlist/{item_id}")
            except:
                pass
    
    def test_get_wishlist_empty_or_existing(self):
        """Test GET /api/wishlist returns a list"""
        response = requests.get(f"{BASE_URL}/api/wishlist")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ GET /api/wishlist returns {len(data)} items")
    
    def test_create_wishlist_item(self):
        """Test POST /api/wishlist creates a new item"""
        payload = {
            "item_type": "locomotora",
            "brand": "TEST_Brand",
            "model": "TEST_Model",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "estimated_price": 150.50,
            "priority": 1,
            "store": "Test Store",
            "url": "https://example.com/test",
            "notes": "Test wishlist item"
        }
        response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["brand"] == payload["brand"]
        assert data["model"] == payload["model"]
        assert data["reference"] == payload["reference"]
        assert data["estimated_price"] == payload["estimated_price"]
        assert data["priority"] == payload["priority"]
        
        self.created_ids.append(data["id"])
        print(f"✅ POST /api/wishlist created item with id: {data['id']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/wishlist/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["brand"] == payload["brand"]
        print("✅ GET /api/wishlist/{id} confirms item persisted")
    
    def test_create_wishlist_item_vagon(self):
        """Test POST /api/wishlist with vagon type"""
        payload = {
            "item_type": "vagon",
            "brand": "TEST_Roco",
            "model": "TEST_Wagon",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "estimated_price": 45.00,
            "priority": 2,
        }
        response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["item_type"] == "vagon"
        self.created_ids.append(data["id"])
        print(f"✅ Created vagon wishlist item: {data['id']}")
    
    def test_update_wishlist_item(self):
        """Test PUT /api/wishlist/{id} updates an item"""
        # Create first
        payload = {
            "item_type": "locomotora",
            "brand": "TEST_Original",
            "model": "TEST_OriginalModel",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "priority": 3
        }
        create_response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        self.created_ids.append(item_id)
        
        # Update
        update_payload = {
            "item_type": "locomotora",
            "brand": "TEST_Updated",
            "model": "TEST_UpdatedModel",
            "reference": payload["reference"],
            "estimated_price": 200.00,
            "priority": 1
        }
        update_response = requests.put(f"{BASE_URL}/api/wishlist/{item_id}", json=update_payload)
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["brand"] == "TEST_Updated"
        assert updated["model"] == "TEST_UpdatedModel"
        assert updated["estimated_price"] == 200.00
        assert updated["priority"] == 1
        print(f"✅ PUT /api/wishlist/{item_id} updated successfully")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/wishlist/{item_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["brand"] == "TEST_Updated"
        print("✅ Update verified with GET")
    
    def test_delete_wishlist_item(self):
        """Test DELETE /api/wishlist/{id} removes an item"""
        # Create first
        payload = {
            "item_type": "locomotora",
            "brand": "TEST_ToDelete",
            "model": "TEST_DeleteModel",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "priority": 2
        }
        create_response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/wishlist/{item_id}")
        assert delete_response.status_code == 200
        print(f"✅ DELETE /api/wishlist/{item_id} returned 200")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/wishlist/{item_id}")
        assert get_response.status_code == 404
        print("✅ Item confirmed deleted (GET returns 404)")
    
    def test_delete_nonexistent_wishlist_item(self):
        """Test DELETE /api/wishlist with non-existent id"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.delete(f"{BASE_URL}/api/wishlist/{fake_id}")
        assert response.status_code == 404
        print("✅ DELETE non-existent item returns 404")
    
    def test_get_nonexistent_wishlist_item(self):
        """Test GET /api/wishlist with non-existent id"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.get(f"{BASE_URL}/api/wishlist/{fake_id}")
        assert response.status_code == 404
        print("✅ GET non-existent item returns 404")


class TestMoveWishlistToCollection:
    """Test moving wishlist items to collection"""
    
    @pytest.fixture(autouse=True)
    def setup_cleanup(self, request):
        """Setup and cleanup test data"""
        self.created_wishlist_ids = []
        self.created_locomotive_ids = []
        self.created_rolling_stock_ids = []
        yield
        # Cleanup
        for item_id in self.created_wishlist_ids:
            try:
                requests.delete(f"{BASE_URL}/api/wishlist/{item_id}")
            except:
                pass
        for loco_id in self.created_locomotive_ids:
            try:
                requests.delete(f"{BASE_URL}/api/locomotives/{loco_id}")
            except:
                pass
        for stock_id in self.created_rolling_stock_ids:
            try:
                requests.delete(f"{BASE_URL}/api/rolling-stock/{stock_id}")
            except:
                pass
    
    def test_move_locomotora_to_collection(self):
        """Test POST /api/wishlist/{id}/move-to-collection for locomotora"""
        # Create wishlist item
        payload = {
            "item_type": "locomotora",
            "brand": "TEST_MoveLocoB",
            "model": "TEST_MoveLocoM",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "estimated_price": 180.00,
            "priority": 1,
            "notes": "Test move to collection"
        }
        create_response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        self.created_wishlist_ids.append(item_id)
        
        # Move to collection
        move_response = requests.post(
            f"{BASE_URL}/api/wishlist/{item_id}/move-to-collection",
            params={"purchase_date": "2024-01-15", "price": 175.00}
        )
        assert move_response.status_code == 200
        
        move_data = move_response.json()
        assert move_data["collection_type"] == "locomotora"
        assert "created_id" in move_data
        
        created_loco_id = move_data["created_id"]
        self.created_locomotive_ids.append(created_loco_id)
        print(f"✅ Move to collection created locomotive: {created_loco_id}")
        
        # Verify locomotive exists
        loco_response = requests.get(f"{BASE_URL}/api/locomotives/{created_loco_id}")
        assert loco_response.status_code == 200
        loco = loco_response.json()
        assert loco["brand"] == payload["brand"]
        assert loco["model"] == payload["model"]
        assert loco["price"] == 175.00
        assert loco["purchase_date"] == "2024-01-15"
        print("✅ Locomotive created with correct data")
        
        # Verify wishlist item deleted
        wishlist_response = requests.get(f"{BASE_URL}/api/wishlist/{item_id}")
        assert wishlist_response.status_code == 404
        print("✅ Wishlist item removed after move")
    
    def test_move_vagon_to_collection(self):
        """Test POST /api/wishlist/{id}/move-to-collection for vagon"""
        # Create wishlist item
        payload = {
            "item_type": "vagon",
            "brand": "TEST_MoveVagonB",
            "model": "TEST_MoveVagonM",
            "reference": f"TEST_{uuid.uuid4().hex[:8]}",
            "estimated_price": 55.00,
            "priority": 2
        }
        create_response = requests.post(f"{BASE_URL}/api/wishlist", json=payload)
        assert create_response.status_code == 200
        item_id = create_response.json()["id"]
        self.created_wishlist_ids.append(item_id)
        
        # Move to collection
        move_response = requests.post(
            f"{BASE_URL}/api/wishlist/{item_id}/move-to-collection",
            params={"purchase_date": "2024-02-20", "price": 50.00}
        )
        assert move_response.status_code == 200
        
        move_data = move_response.json()
        assert move_data["collection_type"] == "material_rodante"
        assert "created_id" in move_data
        
        created_stock_id = move_data["created_id"]
        self.created_rolling_stock_ids.append(created_stock_id)
        print(f"✅ Move to collection created rolling stock: {created_stock_id}")
        
        # Verify rolling stock exists
        stock_response = requests.get(f"{BASE_URL}/api/rolling-stock/{created_stock_id}")
        assert stock_response.status_code == 200
        stock = stock_response.json()
        assert stock["brand"] == payload["brand"]
        assert stock["model"] == payload["model"]
        print("✅ Rolling stock created with correct data")


class TestPDFExport:
    """Test PDF Export endpoints"""
    
    def test_export_catalog_pdf(self):
        """Test GET /api/export/catalog/pdf returns a PDF"""
        response = requests.get(f"{BASE_URL}/api/export/catalog/pdf")
        assert response.status_code == 200
        
        # Verify content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        # Verify content disposition suggests PDF download
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert ".pdf" in content_disposition
        
        # Verify PDF magic bytes (PDF starts with %PDF-)
        assert response.content[:4] == b'%PDF'
        
        print(f"✅ GET /api/export/catalog/pdf returns valid PDF ({len(response.content)} bytes)")
    
    def test_export_locomotive_pdf(self):
        """Test GET /api/export/locomotive/{id}/pdf returns a PDF"""
        # First get an existing locomotive
        list_response = requests.get(f"{BASE_URL}/api/locomotives")
        assert list_response.status_code == 200
        locomotives = list_response.json()
        
        if not locomotives:
            pytest.skip("No locomotives available to test PDF export")
        
        loco_id = locomotives[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/export/locomotive/{loco_id}/pdf")
        assert response.status_code == 200
        
        # Verify content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        # Verify PDF magic bytes
        assert response.content[:4] == b'%PDF'
        
        print(f"✅ GET /api/export/locomotive/{loco_id}/pdf returns valid PDF ({len(response.content)} bytes)")
    
    def test_export_nonexistent_locomotive_pdf(self):
        """Test PDF export with non-existent locomotive"""
        fake_id = f"nonexistent-{uuid.uuid4()}"
        response = requests.get(f"{BASE_URL}/api/export/locomotive/{fake_id}/pdf")
        assert response.status_code == 404
        print("✅ PDF export for non-existent locomotive returns 404")
    
    def test_export_rolling_stock_pdf(self):
        """Test GET /api/export/rolling-stock/{id}/pdf returns a PDF"""
        # First get an existing rolling stock
        list_response = requests.get(f"{BASE_URL}/api/rolling-stock")
        assert list_response.status_code == 200
        stock_list = list_response.json()
        
        if not stock_list:
            pytest.skip("No rolling stock available to test PDF export")
        
        stock_id = stock_list[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/export/rolling-stock/{stock_id}/pdf")
        assert response.status_code == 200
        
        # Verify content type is PDF
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        # Verify PDF magic bytes
        assert response.content[:4] == b'%PDF'
        
        print(f"✅ GET /api/export/rolling-stock/{stock_id}/pdf returns valid PDF ({len(response.content)} bytes)")


class TestStatsWithWishlist:
    """Test that stats endpoint includes wishlist data"""
    
    def test_stats_includes_wishlist(self):
        """Test GET /api/stats includes wishlist stats"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_wishlist" in data
        assert "wishlist_value" in data
        assert isinstance(data["total_wishlist"], int)
        assert isinstance(data["wishlist_value"], (int, float))
        
        print(f"✅ Stats include wishlist: {data['total_wishlist']} items, €{data['wishlist_value']:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
