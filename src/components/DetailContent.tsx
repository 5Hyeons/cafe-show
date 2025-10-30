import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface DetailContentProps {
  topic: string;
  onClose?: () => void;
}

export function DetailContent({ topic, onClose }: DetailContentProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/content/${topic}.md`)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[DetailContent] Failed to load content:', err);
        setContent('상세 정보를 불러올 수 없습니다.');
        setLoading(false);
      });
  }, [topic]);

  if (loading) {
    return (
      <div className="px-5 py-4 text-center text-cafeshow-gray-300">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      {/* MD content with react-markdown */}
      <div
        className="text-[16px] leading-[1.5] tracking-[-0.32px] text-black"
        style={{ wordBreak: 'keep-all' }}
      >
        <ReactMarkdown
          components={{
            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {/* Close button (optional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-1 px-4 py-2 bg-cafeshow-red text-white text-sm rounded-full hover:bg-opacity-90"
        >
          닫기
        </button>
      )}
    </div>
  );
}
