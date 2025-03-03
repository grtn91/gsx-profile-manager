import React from 'react';
import { FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileWithDetails } from '../blocks/profile-uploader/types';

interface FileListProps {
    files: FileWithDetails[];
    onRemoveFile: (index: number) => void;
}

export const FileList: React.FC<FileListProps> = ({ files, onRemoveFile }) => {
    if (files.length === 0) return null;

    return (
        <div className="border rounded-md p-3 bg-muted/30">
            <h4 className="font-medium mb-2">Selected Files ({files.length})</h4>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                    <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between text-sm p-2 rounded-md bg-background"
                    >
                        <div className="flex items-center">
                            <FileType className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{file.name}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveFile(index)}
                            className="h-6 w-6 p-0"
                        >
                            &times;
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
    );
};