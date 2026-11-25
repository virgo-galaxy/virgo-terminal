import type { ComponentPropsWithoutRef } from 'react';
import type { ExtraProps } from 'react-markdown';
import HighlightedCodeBlock, { codeLanguages } from '../HighlightedCodeBlock';

type PreProps = ComponentPropsWithoutRef<'pre'>;

export function GuideCodeBlock({ node, children, ...props }: PreProps & ExtraProps) {
  const element = node?.children[0];
  if (element?.type !== 'element' || element.tagName !== 'code') return <pre {...props}>{children}</pre>;

  const code = element.children[0];
  const classes = element.properties.className;
  const fence = Array.isArray(classes) ? classes[0] : classes;
  const language = codeLanguages.find((candidate) => fence === `language-${candidate}`);
  if (!language || code?.type !== 'text' || element.children.length !== 1) {
    return <pre {...props}>{children}</pre>;
  }

  return <HighlightedCodeBlock key={`${language}:${code.value}`} code={code.value} language={language} {...props} />;
}
