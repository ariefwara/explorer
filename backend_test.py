import requests
import unittest
import json
import os

# Get the backend URL from environment or use default
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

class WindowsExplorerAPITest(unittest.TestCase):
    """Test suite for Windows Explorer API endpoints"""

    def setUp(self):
        """Setup for each test"""
        self.api_url = BACKEND_URL
        # Ensure API is accessible
        try:
            response = requests.get(f"{self.api_url}/api/health")
            if response.status_code != 200:
                self.skipTest(f"API not available at {self.api_url}")
        except requests.RequestException:
            self.skipTest(f"API not available at {self.api_url}")

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.api_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("message", data)

    def test_tree_endpoint(self):
        """Test the tree endpoint returns hierarchical folder structure"""
        response = requests.get(f"{self.api_url}/api/tree")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify it's a list
        self.assertIsInstance(data, list)
        
        # Verify root level folders
        root_folder_names = [folder["name"] for folder in data]
        expected_folders = ["Documents", "Pictures", "Projects"]
        for folder in expected_folders:
            self.assertIn(folder, root_folder_names)
        
        # Verify structure has children
        for folder in data:
            if folder["has_children"]:
                self.assertIn("children", folder)

    def test_root_folder_contents(self):
        """Test the root folder contents endpoint"""
        response = requests.get(f"{self.api_url}/api/folders/root")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify response structure
        self.assertIn("folder", data)
        self.assertIn("children", data)
        
        # Verify root folder properties
        self.assertEqual(data["folder"]["id"], "root")
        self.assertEqual(data["folder"]["name"], "This PC")
        
        # Verify children
        child_names = [child["name"] for child in data["children"]]
        expected_children = ["Documents", "Pictures", "Projects"]
        for child in expected_children:
            self.assertIn(child, child_names)

    def test_documents_folder_contents(self):
        """Test the Documents folder contents endpoint"""
        response = requests.get(f"{self.api_url}/api/folders/documents")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify folder properties
        self.assertEqual(data["folder"]["id"], "documents")
        self.assertEqual(data["folder"]["name"], "Documents")
        
        # Verify children
        child_names = [child["name"] for child in data["children"]]
        expected_children = ["Personal", "Work Documents"]
        for child in expected_children:
            self.assertIn(child, child_names)

    def test_work_docs_folder_contents(self):
        """Test the Work Documents folder contents endpoint"""
        response = requests.get(f"{self.api_url}/api/folders/work_docs")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify folder properties
        self.assertEqual(data["folder"]["id"], "work_docs")
        self.assertEqual(data["folder"]["name"], "Work Documents")
        
        # Verify children (files)
        child_names = [child["name"] for child in data["children"]]
        expected_files = ["Annual Report.docx", "Q4 Presentation.pptx"]
        for file in expected_files:
            self.assertIn(file, child_names)
        
        # Verify file properties
        for child in data["children"]:
            self.assertEqual(child["type"], "file")
            self.assertIsNotNone(child["size"])
            self.assertIsNotNone(child["modified"])

    def test_search_functionality(self):
        """Test the search endpoint"""
        query = "report"
        response = requests.get(f"{self.api_url}/api/search/{query}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify search results
        self.assertIsInstance(data, list)
        self.assertTrue(len(data) > 0, "Search should return at least one result")
        
        # Verify each result contains the search term
        for item in data:
            self.assertIn(query.lower(), item["name"].lower())

    def test_breadcrumbs_functionality(self):
        """Test the breadcrumbs endpoint"""
        response = requests.get(f"{self.api_url}/api/breadcrumbs/work_docs")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify breadcrumb structure
        self.assertIsInstance(data, list)
        
        # Verify breadcrumb path
        breadcrumb_names = [crumb["name"] for crumb in data]
        expected_path = ["This PC", "Documents", "Work Documents"]
        self.assertEqual(breadcrumb_names, expected_path)
        
        # Verify breadcrumb IDs
        breadcrumb_ids = [crumb["id"] for crumb in data]
        expected_ids = ["root", "documents", "work_docs"]
        self.assertEqual(breadcrumb_ids, expected_ids)

    def test_nonexistent_folder(self):
        """Test error handling for non-existent folder"""
        response = requests.get(f"{self.api_url}/api/folders/nonexistent")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)

if __name__ == "__main__":
    unittest.main()