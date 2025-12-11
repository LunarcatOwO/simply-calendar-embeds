import { Suspense } from 'react';
import EmbedContent from './embed-content';

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading...</div>}>
      <EmbedContent />
    </Suspense>
  );
}
