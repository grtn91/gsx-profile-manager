import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileDropzoneProps {
    onFilesAdded: (files: File[]) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesAdded }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: onFilesAdded,
        accept: {
            'text/x-python': ['.py'],
            'text/plain': ['.ini'],
            'application/zip': ['.zip'],
        },
        noClick: false,
        noKeyboard: false,
        preventDropOnDocument: true
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[150px] flex flex-col items-center justify-center
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            `}
            style={{ position: 'relative', zIndex: 10 }}
            onDragOver={e => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
                <Upload className={isDragActive ? 'text-primary' : 'text-muted-foreground'} size={36} />
                {isDragActive ? (
                    <p className="text-primary font-medium">Drop the files here...</p>
                ) : (
                    <>
                        <p className="font-medium">Drag & drop GSX profile files here</p>
                        <p className="text-sm text-muted-foreground">
                            or click to select files (.py and .ini only, or .zip archive)
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};