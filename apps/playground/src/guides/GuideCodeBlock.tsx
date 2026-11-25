import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { createHighlighter } from '@virgo-nsh/highlighter';
import type { ExtraProps } from 'react-markdown';
import '@virgo-nsh/highlighter/theme.css';

// Match the model hashes pinned by @virgo-nsh/highlighter 0.1.1.
const modelRelease = '7109bac49340b94ad5350778e32ee0d4196c5698';
const highlighter = createHighlighter({
  languages: ['tsx', 'css'],
  resolveAssetUrl: ({ modelId, kind }) => {
    const extension = kind === 'model' ? 'onnx' : 'json';
    return `https://raw.githubusercontent.com/virgo-galaxy/virgo-nsh/${modelRelease}/packs/${modelId}/browser/model.${extension}`;
  },
});

type PreProps = ComponentPropsWithoutRef<'pre'>;

export function GuideCodeBlock({ node, children, ...props }: PreProps & ExtraProps) {
  const element = node?.children[0];
  if (element?.type !== 'element' || element.tagName !== 'code') return <pre {...props}>{children}</pre>;

  const code = element.children[0];
  const classes = element.properties.className;
  const fence = Array.isArray(classes) ? classes[0] : classes;
  if (code?.type !== 'text' || element.children.length !== 1 || (fence !== 'language-tsx' && fence !== 'language-css')) {
    return <pre {...props}>{children}</pre>;
  }

  const language = fence.slice('language-'.length);
  return <HighlightedBlock key={`${language}:${code.value}`} code={code.value} language={language} {...props} />;
}

function HighlightedBlock({ code, language, ...props }: PreProps & { code: string; language: string }) {
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
