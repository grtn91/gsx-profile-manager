#[derive(serde::Serialize)]
pub struct TreeDataItem {
    pub id: String,
    pub name: String,
    pub children: Option<Vec<TreeDataItem>>,
}