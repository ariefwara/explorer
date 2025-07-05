from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
from datetime import datetime

app = FastAPI(title="Windows Explorer API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class FileItem(BaseModel):
    id: str
    name: str
    type: str  # 'file' or 'folder'
    parent_id: Optional[str] = None
    size: Optional[int] = None
    modified: str
    path: str
    children: Optional[List['FileItem']] = None
    has_children: bool = False

class FolderResponse(BaseModel):
    folder: FileItem
    children: List[FileItem]

# In-memory file system simulation
file_system = {
    "root": {
        "id": "root",
        "name": "This PC",
        "type": "folder",
        "parent_id": None,
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/",
        "has_children": True
    },
    "documents": {
        "id": "documents",
        "name": "Documents",
        "type": "folder",
        "parent_id": "root",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Documents",
        "has_children": True
    },
    "pictures": {
        "id": "pictures",
        "name": "Pictures",
        "type": "folder",
        "parent_id": "root",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Pictures",
        "has_children": True
    },
    "projects": {
        "id": "projects",
        "name": "Projects",
        "type": "folder",
        "parent_id": "root",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Projects",
        "has_children": True
    },
    "work_docs": {
        "id": "work_docs",
        "name": "Work Documents",
        "type": "folder",
        "parent_id": "documents",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Documents/Work Documents",
        "has_children": True
    },
    "personal_docs": {
        "id": "personal_docs",
        "name": "Personal",
        "type": "folder",
        "parent_id": "documents",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Documents/Personal",
        "has_children": False
    },
    "vacation_pics": {
        "id": "vacation_pics",
        "name": "Vacation 2024",
        "type": "folder",
        "parent_id": "pictures",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Pictures/Vacation 2024",
        "has_children": False
    },
    "web_projects": {
        "id": "web_projects",
        "name": "Web Development",
        "type": "folder",
        "parent_id": "projects",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Projects/Web Development",
        "has_children": True
    },
    # Files
    "report_doc": {
        "id": "report_doc",
        "name": "Annual Report.docx",
        "type": "file",
        "parent_id": "work_docs",
        "size": 2048576,
        "modified": datetime.now().isoformat(),
        "path": "/Documents/Work Documents/Annual Report.docx",
        "has_children": False
    },
    "presentation": {
        "id": "presentation",
        "name": "Q4 Presentation.pptx",
        "type": "file",
        "parent_id": "work_docs",
        "size": 5242880,
        "modified": datetime.now().isoformat(),
        "path": "/Documents/Work Documents/Q4 Presentation.pptx",
        "has_children": False
    },
    "beach_photo": {
        "id": "beach_photo",
        "name": "beach_sunset.jpg",
        "type": "file",
        "parent_id": "vacation_pics",
        "size": 1048576,
        "modified": datetime.now().isoformat(),
        "path": "/Pictures/Vacation 2024/beach_sunset.jpg",
        "has_children": False
    },
    "react_app": {
        "id": "react_app",
        "name": "my-react-app",
        "type": "folder",
        "parent_id": "web_projects",
        "size": None,
        "modified": datetime.now().isoformat(),
        "path": "/Projects/Web Development/my-react-app",
        "has_children": True
    },
    "index_js": {
        "id": "index_js",
        "name": "index.js",
        "type": "file",
        "parent_id": "react_app",
        "size": 1024,
        "modified": datetime.now().isoformat(),
        "path": "/Projects/Web Development/my-react-app/index.js",
        "has_children": False
    }
}

def get_children(parent_id: str) -> List[FileItem]:
    """Get all children of a parent folder"""
    children = []
    for item_id, item_data in file_system.items():
        if item_data.get("parent_id") == parent_id:
            children.append(FileItem(**item_data))
    return sorted(children, key=lambda x: (x.type == 'file', x.name.lower()))

def get_item_by_id(item_id: str) -> Optional[FileItem]:
    """Get a file system item by its ID"""
    item_data = file_system.get(item_id)
    if item_data:
        return FileItem(**item_data)
    return None

def build_tree(parent_id: str = "root") -> List[FileItem]:
    """Build a hierarchical tree structure"""
    children = get_children(parent_id)
    for child in children:
        if child.type == "folder" and child.has_children:
            child.children = build_tree(child.id)
    return children

@app.get("/api/folders/{folder_id}", response_model=FolderResponse)
async def get_folder_contents(folder_id: str):
    """Get folder contents by folder ID"""
    folder = get_item_by_id(folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if folder.type != "folder":
        raise HTTPException(status_code=400, detail="Item is not a folder")
    
    children = get_children(folder_id)
    return FolderResponse(folder=folder, children=children)

@app.get("/api/tree", response_model=List[FileItem])
async def get_folder_tree():
    """Get the complete folder tree structure"""
    return build_tree()

@app.get("/api/breadcrumbs/{item_id}")
async def get_breadcrumbs(item_id: str):
    """Get breadcrumb navigation for an item"""
    breadcrumbs = []
    current_id = item_id
    
    while current_id:
        item = get_item_by_id(current_id)
        if not item:
            break
        breadcrumbs.insert(0, {
            "id": item.id,
            "name": item.name,
            "path": item.path
        })
        current_id = item.parent_id
    
    return breadcrumbs

@app.get("/api/search/{query}")
async def search_files(query: str):
    """Search for files and folders by name"""
    results = []
    query_lower = query.lower()
    
    for item_id, item_data in file_system.items():
        if query_lower in item_data["name"].lower():
            results.append(FileItem(**item_data))
    
    return sorted(results, key=lambda x: (x.type == 'file', x.name.lower()))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Windows Explorer API is running"}

# Serve static files (React build)
if os.path.exists("/app/frontend/build"):
    app.mount("/static", StaticFiles(directory="/app/frontend/build/static"), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        """Serve React app for all non-API routes"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Serve index.html for all routes (React Router)
        return FileResponse("/app/frontend/build/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)