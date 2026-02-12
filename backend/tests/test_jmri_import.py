"""
Test suite for JMRI Import functionality in Railway Collection App
Tests the /api/import/jmri endpoint and related features
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Sample JMRI XML content for testing
VALID_JMRI_XML = '''<?xml version="1.0" encoding="UTF-8"?>
<locomotive-config>
    <locomotive mfg="TEST_ESU" roadName="BR 218" roadNumber="TEST_218-001" dccAddress="218" comment="Test diesel locomotive">
        <decoder family="ESU LokPilot V4.0" model="LokPilot micro V4.0"/>
        <values>
            <CVvalue name="1" value="218"/>
            <CVvalue name="3" value="10"/>
            <CVvalue name="4" value="8"/>
            <CVvalue name="29" value="6"/>
        </values>
    </locomotive>
</locomotive-config>'''

VALID_JMRI_XML_ELECTRIC = '''<?xml version="1.0" encoding="UTF-8"?>
<locomotive-config>
    <locomotive mfg="TEST_Roco" roadName="252 RENFE" roadNumber="TEST_252-050" dccAddress="252" comment="Electric locomotive">
        <decoder family="Zimo MX645" model="MX645"/>
    </locomotive>
</locomotive-config>'''

INVALID_XML = '''<?xml version="1.0" encoding="UTF-8"?>
<invalid>No locomotive element here</invalid>'''

MALFORMED_XML = '''not valid xml at all'''


class TestJMRIImportEndpoint:
    """Tests for /api/import/jmri endpoint"""

    def test_import_single_valid_xml(self):
        """Test importing a single valid JMRI XML file"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[VALID_JMRI_XML],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "success" in data
        assert "imported_count" in data
        assert "skipped_count" in data
        assert "errors" in data
        assert "locomotives" in data
        
        # Check import success
        assert data["success"] == True
        assert data["imported_count"] == 1
        assert data["skipped_count"] == 0
        assert len(data["errors"]) == 0
        
        # Check imported locomotive data
        assert len(data["locomotives"]) == 1
        loco = data["locomotives"][0]
        assert loco["brand"] == "TEST_ESU"
        assert loco["model"] == "BR 218"
        assert loco["dcc_address"] == 218

    def test_import_multiple_valid_xml(self):
        """Test importing multiple valid JMRI XML files"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[VALID_JMRI_XML, VALID_JMRI_XML_ELECTRIC],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["imported_count"] == 2
        assert len(data["locomotives"]) == 2

    def test_import_invalid_xml_without_locomotive(self):
        """Test importing XML without locomotive element"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[INVALID_XML],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return success=False since no locomotives were imported
        assert data["success"] == False
        assert data["imported_count"] == 0
        assert data["skipped_count"] == 1
        assert len(data["errors"]) > 0

    def test_import_malformed_xml(self):
        """Test importing malformed XML content"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[MALFORMED_XML],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == False
        assert data["imported_count"] == 0
        assert data["skipped_count"] == 1

    def test_import_mixed_valid_invalid_xml(self):
        """Test importing mix of valid and invalid XML files"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[VALID_JMRI_XML, INVALID_XML, VALID_JMRI_XML_ELECTRIC],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should import 2 valid ones and skip 1 invalid
        assert data["success"] == True  # At least one imported
        assert data["imported_count"] == 2
        assert data["skipped_count"] == 1

    def test_import_empty_array(self):
        """Test importing with empty array"""
        response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == False
        assert data["imported_count"] == 0


class TestJMRIDataPersistence:
    """Tests for verifying imported data persists correctly"""

    def test_imported_locomotive_appears_in_list(self):
        """Test that imported locomotives appear in /api/locomotives"""
        # First import a unique locomotive
        unique_xml = '''<?xml version="1.0" encoding="UTF-8"?>
        <locomotive-config>
            <locomotive mfg="TEST_Persistence" roadName="Persistence Test" roadNumber="TEST_PERSIST_001" dccAddress="999" comment="Persistence test">
                <decoder family="Test Family" model="Test Model"/>
            </locomotive>
        </locomotive-config>'''
        
        # Import
        import_response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[unique_xml],
            headers={"Content-Type": "application/json"}
        )
        assert import_response.status_code == 200
        
        # Verify it appears in locomotive list
        list_response = requests.get(f"{BASE_URL}/api/locomotives")
        assert list_response.status_code == 200
        
        locomotives = list_response.json()
        # Find our imported locomotive
        imported_loco = next(
            (l for l in locomotives if l.get("brand") == "TEST_Persistence"),
            None
        )
        
        assert imported_loco is not None
        assert imported_loco["model"] == "Persistence Test"
        assert imported_loco["dcc_address"] == 999

    def test_cv_modifications_stored(self):
        """Test that CV modifications from XML are stored"""
        xml_with_cvs = '''<?xml version="1.0" encoding="UTF-8"?>
        <locomotive-config>
            <locomotive mfg="TEST_CVTest" roadName="CV Test Loco" roadNumber="TEST_CV001" dccAddress="111">
                <decoder family="ESU" model="LokPilot"/>
                <values>
                    <CVvalue name="1" value="111"/>
                    <CVvalue name="3" value="15"/>
                    <CVvalue name="4" value="12"/>
                </values>
            </locomotive>
        </locomotive-config>'''
        
        # Import
        import_response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[xml_with_cvs],
            headers={"Content-Type": "application/json"}
        )
        assert import_response.status_code == 200
        
        # Get the imported locomotive details
        list_response = requests.get(f"{BASE_URL}/api/locomotives")
        assert list_response.status_code == 200
        
        locomotives = list_response.json()
        cv_loco = next(
            (l for l in locomotives if l.get("brand") == "TEST_CVTest"),
            None
        )
        
        assert cv_loco is not None
        # Check CV modifications were stored
        cv_mods = cv_loco.get("cv_modifications", [])
        assert len(cv_mods) > 0
        
        # Check specific CV values
        cv1 = next((cv for cv in cv_mods if cv.get("cv_number") == 1), None)
        assert cv1 is not None
        assert cv1["value"] == 111


class TestBackupHistoryAfterJMRIImport:
    """Tests for backup history recording JMRI imports"""

    def test_jmri_import_creates_history_entry(self):
        """Test that JMRI import creates a backup history entry"""
        # Import a locomotive
        xml = '''<?xml version="1.0" encoding="UTF-8"?>
        <locomotive-config>
            <locomotive mfg="TEST_History" roadName="History Test" roadNumber="TEST_HIST001" dccAddress="888">
                <decoder family="Test" model="Test"/>
            </locomotive>
        </locomotive-config>'''
        
        import_response = requests.post(
            f"{BASE_URL}/api/import/jmri",
            json=[xml],
            headers={"Content-Type": "application/json"}
        )
        assert import_response.status_code == 200
        assert import_response.json()["success"] == True
        
        # Check backup history
        history_response = requests.get(f"{BASE_URL}/api/backup/history")
        assert history_response.status_code == 200
        
        history = history_response.json()
        # Find a jmri_import entry
        jmri_entries = [h for h in history if h.get("type") == "jmri_import"]
        assert len(jmri_entries) > 0


class TestBackupPage:
    """Tests for backup page endpoints that link to JMRI import"""
    
    def test_backup_endpoint_returns_all_collections(self):
        """Test /api/backup returns all collections including imported locomotives"""
        response = requests.get(f"{BASE_URL}/api/backup")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "version" in data
        assert "created_at" in data
        assert "locomotives" in data
        assert "rolling_stock" in data
        assert "decoders" in data
        assert "sound_projects" in data
        
        # Should have locomotives (including imported ones)
        assert len(data["locomotives"]) >= 1


class TestCleanup:
    """Cleanup test data after tests"""
    
    def test_cleanup_test_locomotives(self):
        """Clean up TEST_ prefixed locomotives"""
        # Get all locomotives
        response = requests.get(f"{BASE_URL}/api/locomotives")
        assert response.status_code == 200
        
        locomotives = response.json()
        
        # Delete TEST_ locomotives
        for loco in locomotives:
            if loco.get("brand", "").startswith("TEST_"):
                delete_response = requests.delete(f"{BASE_URL}/api/locomotives/{loco['id']}")
                assert delete_response.status_code in [200, 404]
        
        print("Cleanup completed - removed TEST_ prefixed locomotives")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
