use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

#[derive(serde::Serialize)]
pub struct TreeDataItem {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub children: Option<Vec<TreeDataItem>>,
}

impl TreeDataItem {
    // Constructor that generates a hashed ID from the path
    pub fn new(name: String, path: String, is_directory: bool, children: Option<Vec<TreeDataItem>>) -> Self {
        // Generate a hash from the path to ensure uniqueness
        let id = Self::hash_path(&path);
        
        Self {
            id,
            name,
            path,
            is_directory,
            children,
        }
    }
    
    // Hash the path to create a unique ID
    fn hash_path(path: &str) -> String {
        let mut hasher = DefaultHasher::new();
        path.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }
}