import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GeneratedImageViewer } from './components/GeneratedImageViewer';
import { Alert } from './components/Alert';
import { generateImage } from './services/geminiService';
import { CATEGORY_DETAILS, CATEGORY_ORDER, YOLO_CLASSES } from './constants';
import type { ImageCategory, GeneratedImage } from './types';

declare var JSZip: any;

type GeneratedImagesState = Partial<Record<ImageCategory, GeneratedImage[]>>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImagesState>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setError(null);
    setGeneratedImages({});
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setOriginalImagePreview(previewUrl);
    } else {
      setSelectedFile(null);
      if (originalImagePreview) {
        URL.revokeObjectURL(originalImagePreview);
      }
      setOriginalImagePreview(null);
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedFile) {
      setError('请先选择一张图片。');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages({});

    try {
      const base64Image = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type;

      const allPrompts = Object.entries(CATEGORY_DETAILS).flatMap(([category, details]) =>
        details.prompts.map(prompt => ({ category: category as ImageCategory, prompt }))
      );
      
      let generatedCount = 0;
      setLoadingMessage(`正在处理 (0/${allPrompts.length})...`);
      
      for (const { category, prompt } of allPrompts) {
        let success = false;
        let retries = 3;
        let delay = 2000; // Start with a 2-second delay for retries

        while (!success && retries > 0) {
            try {
              const { imageUrl, label } = await generateImage(base64Image, mimeType, prompt, category);
              const newImage: GeneratedImage = { id: self.crypto.randomUUID(), src: imageUrl, prompt, label };

              setGeneratedImages(prev => ({
                ...prev,
                [category]: [...(prev[category] || []), newImage],
              }));
              success = true; // Mark as success to exit the while loop
            } catch (err: any) {
              const errorMessage = err?.message || err.toString();
              if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('rate limit')) {
                retries--;
                if (retries > 0) {
                    console.warn(`Rate limit hit for prompt: "${prompt}". Retrying in ${delay / 1000}s... (${retries} retries left)`);
                    await sleep(delay);
                    delay *= 2; // Exponential backoff
                } else {
                    console.error(`Failed to generate image for prompt: "${prompt}" after multiple retries due to rate limiting.`, err);
                }
              } else {
                // It's a different error, don't retry
                console.error(`Failed to generate image for prompt: "${prompt}"`, err);
                retries = 0; // stop retrying by setting retries to 0
              }
            }
        }
        
        if (success) {
            generatedCount++;
            setLoadingMessage(`正在处理 (${generatedCount}/${allPrompts.length})...`);
            // Small delay between successful requests to avoid hitting limits
            await sleep(500); 
        }
      }

      if (generatedCount < allPrompts.length) {
        setError(`部分图片生成失败。请检查控制台以获取更多信息。成功 ${generatedCount}/${allPrompts.length} 张。`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
      setError(`图片生成失败: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  }, [selectedFile]);

  const handleDownloadAll = async () => {
    if (Object.keys(generatedImages).length === 0) return;

    setIsZipping(true);
    setError(null);

    try {
        const zip = new JSZip();
        const imagesFolder = zip.folder("images");
        const labelsFolder = zip.folder("labels");
        
        if (!imagesFolder || !labelsFolder) {
          throw new Error("Could not create folders in zip");
        }
        
        // Add classes.txt file to the root
        zip.file('classes.txt', YOLO_CLASSES.join('\n'));

        const imagePromises: Promise<void>[] = [];

        for (const category of CATEGORY_ORDER) {
            const images = generatedImages[category] || [];
            images.forEach((image, index) => {
                const safeCategory = category.toLowerCase().replace(/_/g, '-');
                const baseName = `${safeCategory}-${index + 1}`;

                // Add label file to the 'labels' folder
                labelsFolder.file(`${baseName}.txt`, image.label);

                // Add image file to the 'images' folder
                const promise = fetch(image.src)
                    .then(res => res.blob())
                    .then(blob => {
                        imagesFolder.file(`${baseName}.png`, blob);
                    });
                imagePromises.push(promise);
            });
        }

        await Promise.all(imagePromises);

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'ai-generated-images-with-labels.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '创建压缩文件失败。';
        setError(`下载失败: ${errorMessage}`);
        console.error(err);
    } finally {
        setIsZipping(false);
    }
  };

  const hasGeneratedImages = Object.keys(generatedImages).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-slate-600 mb-8">
            上传一张清晰的正面照片，AI将为您生成四种不同情境下的形象。为了最佳效果，请确保照片光线充足，面部无遮挡。
          </p>

          <ImageUploader
            onFileSelect={handleFileSelect}
            imagePreview={originalImagePreview}
          />
          
          {error && <div className="mt-4"><Alert message={error} /></div>}

          <div className="mt-6 text-center">
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || isLoading}
              className="px-8 py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              {isLoading ? '正在生成...' : '开始生成形象'}
            </button>
          </div>

          {hasGeneratedImages && !isLoading && (
            <div className="mt-6 text-center">
              <button
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isZipping ? '正在压缩...' : '一键下载所有图片和标签 (.zip)'}
              </button>
            </div>
          )}

          <GeneratedImageViewer
            images={generatedImages}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
          />
        </div>
      </main>
      <footer className="text-center py-4 text-slate-500 text-sm">
        <p>由 Google Gemini API 驱动</p>
      </footer>
    </div>
  );
};

export default App;
