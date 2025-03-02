export interface TreeDataItem {
    id: string
    name: string
    path: string
    isDirectory: boolean
    icon?: any
    selectedIcon?: any
    openIcon?: any
    children?: TreeDataItem[]
    actions?: React.ReactNode
    onClick?: () => void
}