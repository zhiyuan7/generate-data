
import React, { useCallback, useState } from 'react';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  imagePreview: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, imagePreview }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
      <label
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex justify-center items-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'}`}
      >
        {imagePreview ? (
          <div className="relative h-full w-full">
            <img src={imagePreview} alt="预览" className="object-contain h-full w-full rounded-md" />
            <button
                onClick={(e) => {
                    e.preventDefault();
                    onFileSelect(null);
                }}
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
                title="移除图片"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">点击上传</span> 或拖拽文件到此</p>
            <p className="text-xs text-slate-400">支持 PNG, JPG, WEBP 等格式</p>
          </div>
        )}
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" />
      </label>
    </div>
  );
};
