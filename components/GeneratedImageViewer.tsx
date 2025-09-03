import React from 'react';
import type { ImageCategory, GeneratedImage } from '../types';
import { CATEGORY_ORDER } from '../constants';
import { Spinner } from './Spinner';

interface GeneratedImageViewerProps {
  images: Partial<Record<ImageCategory, GeneratedImage[]>>;
  isLoading: boolean;
  loadingMessage: string | null;
}

const ImageCard: React.FC<{ image: GeneratedImage }> = React.memo(({ image }) => {
    return (
        <div className="group relative aspect-square overflow-hidden rounded-lg shadow-lg bg-slate-100">
            <img src={image.src} alt={image.prompt} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex flex-col justify-end p-2">
                <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">{image.prompt}</p>
                {image.label && (
                  <pre className="mt-1 text-sky-300 text-[10px] leading-tight font-mono break-all whitespace-pre-wrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100 transform translate-y-4 group-hover:translate-y-0">{image.label}</pre>
                )}
            </div>
        </div>
    );
});

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({ images, isLoading, loadingMessage }) => {
  const allImages = CATEGORY_ORDER.flatMap(category => {
    const categoryImages = images[category] || [];
    // If a category is loading, fill with placeholders to maintain grid structure
    if (categoryImages.length < 4) {
        return [
            ...categoryImages,
            ...Array.from({ length: 4 - categoryImages.length }).map((_, i) => ({
                id: `placeholder-${category}-${i}`,
                src: '',
                prompt: '',
                label: '',
                isPlaceholder: true,
            }))
        ];
    }
    return categoryImages;
  }).slice(0, 16); // Ensure we only ever have 16 items

  const hasImages = allImages.some(img => !('isPlaceholder' in img));

  if (isLoading) {
    return (
      <div className="mt-12 text-center">
        <Spinner />
        <p className="text-slate-600 mt-4 font-medium">{loadingMessage || '正在初始化...'}</p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({length: 16}).map((_, index) => (
                <div key={index} className="aspect-square bg-slate-200 rounded-lg animate-pulse"></div>
            ))}
        </div>
      </div>
    );
  }

  if (!hasImages) {
    return null;
  }
  
  return (
    <div className="mt-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allImages.map((image) => (
          'isPlaceholder' in image ?
          <div key={image.id} className="aspect-square bg-slate-200 rounded-lg animate-pulse"></div>
          :
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
};
