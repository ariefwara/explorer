import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Folder, 
  FolderOpen, 
  File, 
  ChevronRight, 
  ChevronDown, 
  Home,
  Search,
  RefreshCw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Tree Node Component
const TreeNode = ({ node, selectedId, onSelect, expandedNodes, onToggleExpand }) => {
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.has_children || (node.children && node.children.length > 0);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleSelect = () => {
    onSelect(node);
  };

  return (
    <div className="select-none">
      <div 
        className={`explorer-tree-item ${isSelected ? 'selected' : ''}`}
        onClick={handleSelect}
      >
        <div className="flex items-center">
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="explorer-icon hover:bg-gray-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 h-4 mr-2" />}
          
          {node.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="explorer-folder-icon" />
            ) : (
              <Folder className="explorer-folder-icon" />
            )
          ) : (
            <File className="explorer-file-icon" />
          )}
          
          <span className="text-sm truncate">{node.name}</span>
        </div>
      </div>
      
      {hasChildren && isExpanded && node.children && (
        <div className="ml-4 border-l border-gray-200">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// File List Component
const FileList = ({ items, selectedId, onSelect }) => {
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="bg-white">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 p-3 bg-explorer-gray border-b border-explorer-border text-sm font-medium text-gray-700">
          <div>Name</div>
          <div>Date modified</div>
          <div>Type</div>
          <div>Size</div>
        </div>
        
        {/* File List */}
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              className={`explorer-file-item grid grid-cols-4 gap-4 ${
                selectedId === item.id ? 'selected' : ''
              }`}
              onClick={() => onSelect(item)}
            >
              <div className="flex items-center">
                {item.type === 'folder' ? (
                  <Folder className="explorer-folder-icon" />
                ) : (
                  <File className="explorer-file-icon" />
                )}
                <span className="text-sm truncate">{item.name}</span>
              </div>
              <div className="text-sm text-gray-600 truncate">
                {formatDate(item.modified)}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {item.type === 'folder' ? 'File folder' : 'File'}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {formatFileSize(item.size)}
              </div>
            </div>
          ))}
        </div>
        
        {items.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>This folder is empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Breadcrumb Component
const Breadcrumb = ({ breadcrumbs, onNavigate }) => {
  return (
    <div className="flex items-center p-2 bg-white border-b border-explorer-border">
      <Home className="w-4 h-4 mr-2 text-gray-500" />
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          {index > 0 && <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />}
          <button
            onClick={() => onNavigate(crumb.id)}
            className="text-sm text-explorer-blue hover:underline"
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

// Main App Component
const App = () => {
  const [treeData, setTreeData] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentItems, setCurrentItems] = useState([]);
  const [selectedId, setSelectedId] = useState('root');
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load tree data
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/tree`);
      setTreeData(response.data);
    } catch (err) {
      setError('Failed to load folder tree');
      console.error('Error loading tree data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load folder contents
  const loadFolderContents = useCallback(async (folderId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/folders/${folderId}`);
      setCurrentFolder(response.data.folder);
      setCurrentItems(response.data.children);
    } catch (err) {
      setError('Failed to load folder contents');
      console.error('Error loading folder contents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load breadcrumbs
  const loadBreadcrumbs = useCallback(async (itemId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/breadcrumbs/${itemId}`);
      setBreadcrumbs(response.data);
    } catch (err) {
      console.error('Error loading breadcrumbs:', err);
    }
  }, []);

  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    setSelectedId(node.id);
    if (node.type === 'folder') {
      loadFolderContents(node.id);
      loadBreadcrumbs(node.id);
    }
  }, [loadFolderContents, loadBreadcrumbs]);

  // Handle node expansion
  const handleToggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((folderId) => {
    setSelectedId(folderId);
    loadFolderContents(folderId);
    loadBreadcrumbs(folderId);
  }, [loadFolderContents, loadBreadcrumbs]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/search/${encodeURIComponent(searchQuery)}`);
      setCurrentItems(response.data);
      setCurrentFolder({ name: `Search results for "${searchQuery}"` });
      setBreadcrumbs([{ id: 'search', name: 'Search Results', path: '/search' }]);
    } catch (err) {
      setError('Search failed');
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadTreeData();
    if (selectedId) {
      loadFolderContents(selectedId);
      loadBreadcrumbs(selectedId);
    }
  }, [loadTreeData, loadFolderContents, loadBreadcrumbs, selectedId]);

  // Initialize app
  useEffect(() => {
    loadTreeData();
    loadFolderContents('root');
    loadBreadcrumbs('root');
  }, [loadTreeData, loadFolderContents, loadBreadcrumbs]);

  return (
    <div className="h-screen flex flex-col bg-explorer-gray font-segoe">
      {/* Title Bar */}
      <div className="bg-white border-b border-explorer-border p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-1">
            <button className="p-1 hover:bg-gray-100 rounded" title="Back">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded" title="Forward">
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search files and folders"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="outline-none text-sm flex-1"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tree View */}
        <div className="w-64 bg-explorer-sidebar border-r border-explorer-border flex flex-col">
          <div className="p-2 border-b border-explorer-border">
            <h3 className="text-sm font-medium text-gray-700">Folders</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {loading && treeData.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                <p>Loading...</p>
              </div>
            ) : (
              treeData.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  selectedId={selectedId}
                  onSelect={handleNodeSelect}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Content - File List */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Breadcrumb */}
          {breadcrumbs.length > 0 && (
            <Breadcrumb
              breadcrumbs={breadcrumbs}
              onNavigate={handleBreadcrumbNavigate}
            />
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {error ? (
              <div className="p-8 text-center text-red-500">
                <p>{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-explorer-blue text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>Loading...</p>
              </div>
            ) : (
              <FileList
                items={currentItems}
                selectedId={selectedId}
                onSelect={handleNodeSelect}
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-explorer-gray border-t border-explorer-border p-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>
            {currentFolder && `${currentItems.length} items in ${currentFolder.name}`}
          </span>
          <span>Windows Explorer Web</span>
        </div>
      </div>
    </div>
  );
};

export default App;