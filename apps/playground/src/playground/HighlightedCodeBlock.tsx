import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { createHighlighter } from '@virgo-nsh/highlighter';
import '@virgo-nsh/highlighter/theme.css';

// Match the model hashes pinned by @virgo-nsh/highlighter 0.1.1.
const modelRelease = '7109bac49340b94ad5350778e32ee0d4196c5698';
export const codeLanguages = ['tsx', 'css', 'bash'] as const;

const highlighter = createHighlighter({
  languages: codeLanguages,
  resolveAssetUrl: ({ modelId, kind }) => {
    const extension = kind === 'model' ? 'onnx' : 'json';
    return `https://raw.githubusercontent.com/virgo-galaxy/virgo-nsh/${modelRelease}/packs/${modelId}/browser/model.${extension}`;
  },
});

type CodeBlockProps = ComponentPropsWithoutRef<'pre'> & {
  code: string;
  language: (typeof codeLanguages)[number];
};

export default function HighlightedCodeBlock({ code, language, ...props }: CodeBlockProps) {
  const block = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const element = block.current;
    if (!element) return;
    return highlighter.observeElement(element, { language });
  }, [language]);

  return (
    <pre {...props} ref={block} data-language={language}>
      <code>{code}</code>
    </pre>
  );
}
