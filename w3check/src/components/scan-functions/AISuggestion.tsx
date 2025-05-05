'use client';

import React from 'react';

interface AISuggestionProps {
  suggestion: string;
}

type SectionType = 'paragraph' | 'code' | 'heading';
interface Section {
  type: SectionType;
  content: string;
}

interface BeforeAfterBlock {
  type: 'beforeAfterBlock';
  before: string;
  after: string;
}

type SectionOrBlock = Section | BeforeAfterBlock;

export default function AISuggestion({ suggestion }: AISuggestionProps) {
  if (!suggestion) {
    return <p className="text-sm text-gray-500 italic">No AI suggestion available</p>;
  }

  // Preprocess the suggestion to split it into sections
  const sections = processSuggestion(suggestion);

  // Group the sections to identify Before/After blocks
  const groupedSections: SectionOrBlock[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Check if this is the start of a Before/After pattern
    if (
      section.type === 'heading' && 
      section.content.includes('Before:') && 
      i + 3 < sections.length &&
      sections[i+1].type === 'code' &&
      sections[i+2].type === 'heading' && 
      sections[i+2].content.includes('After:') &&
      sections[i+3].type === 'code'
    ) {
      // Group the Before/After sections
      groupedSections.push({
        type: 'beforeAfterBlock',
        before: sections[i+1].content,
        after: sections[i+3].content
      });
      
      // Skip the sections we've grouped
      i += 3;
    } else {
      groupedSections.push(section);
    }
  }

  return (
    <div className="space-y-5 text-gray-800 border-l-4 border-blue-100 pl-4 py-1">
      {groupedSections.map((section, index) => {
        // Handle BeforeAfter blocks
        if (section.type === 'beforeAfterBlock') {
          const block = section as BeforeAfterBlock;
          return (
            <div key={index} className="mt-6 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 text-base flex items-center">
                    <span className="bg-red-50 px-2 py-1 rounded-md border border-red-100 inline-block">
                      Before:
                    </span>
                  </h4>
                  <div className="bg-red-50 p-3 rounded-md font-mono text-xs overflow-x-auto border border-red-100 my-1">
                    {block.before.split('\n').map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap">{line}</div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 text-base flex items-center">
                    <span className="bg-green-50 px-2 py-1 rounded-md border border-green-100 inline-block">
                      After:
                    </span>
                  </h4>
                  <div className="bg-green-50 p-3 rounded-md font-mono text-xs overflow-x-auto border border-green-100 my-1">
                    {block.after.split('\n').map((line, i) => (
                      <div key={i} className="whitespace-pre-wrap">{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // Check if this section is code
        if (section.type === 'code') {
          return (
            <div 
              key={index} 
              className="bg-gray-50 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200 my-3 shadow-sm"
            >
              {section.content.split('\n').map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          );
        }
        
        // Check if this is a heading/subheading
        if (section.type === 'heading') {
          // Special styling for Before/After sections that weren't caught in grouping
          if (section.content.includes('Before:')) {
            return (
              <div key={index} className="mt-6">
                <h4 className="font-semibold text-red-700 text-base flex items-center">
                  <span className="bg-red-50 px-2 py-1 rounded-md border border-red-100 inline-block">
                    Before:
                  </span>
                </h4>
              </div>
            );
          }
          
          if (section.content.includes('After:')) {
            return (
              <div key={index} className="mt-6">
                <h4 className="font-semibold text-green-700 text-base flex items-center">
                  <span className="bg-green-50 px-2 py-1 rounded-md border border-green-100 inline-block">
                    After:
                  </span>
                </h4>
              </div>
            );
          }
          
          // Normal heading
          return (
            <h4 
              key={index} 
              className="font-semibold text-blue-700 text-base mt-5 mb-2 border-b border-blue-100 pb-1 inline-block"
            >
              {section.content}
            </h4>
          );
        }
        
        // Normal paragraph
        return (
          <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
            {section.content}
          </p>
        );
      })}
    </div>
  );
}

function processSuggestion(suggestion: string): Section[] {
  const sections: Section[] = [];
  
  // Replace markdown headers with plain text (removing the # symbols)
  suggestion = suggestion.replace(/^###\s+(.+)$/gm, '$1:');
  suggestion = suggestion.replace(/^##\s+(.+)$/gm, '$1:');
  suggestion = suggestion.replace(/^#\s+(.+)$/gm, '$1:');
  
  // Convert other markdown syntax
  suggestion = suggestion.replace(/\*\*(.+?)\*\*/g, '$1'); // Remove bold
  suggestion = suggestion.replace(/\*(.+?)\*/g, '$1');     // Remove italic
  suggestion = suggestion.replace(/`(.+?)`/g, '$1');       // Remove inline code markers
  
  // Extract code blocks with their proper fences
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]+?)```/g;
  const codeBlocks: string[] = [];
  
  // Replace code blocks with placeholders and store them
  const processedSuggestion = suggestion.replace(codeBlockRegex, (_, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(code.trim());
    return placeholder;
  });
  
  // Split by double newlines to separate paragraphs
  const rawParagraphs = processedSuggestion.split(/\n\n+/);
  
  for (const paragraph of rawParagraphs) {
    // Skip empty paragraphs
    if (!paragraph.trim()) continue;
    
    // Check if this paragraph contains a code block placeholder
    const codeBlockMatch = paragraph.match(/__CODE_BLOCK_(\d+)__/);
    if (codeBlockMatch) {
      const codeIndex = parseInt(codeBlockMatch[1]);
      if (codeBlocks[codeIndex]) {
        // Extract any text before/after the code block
        const parts = paragraph.split(codeBlockMatch[0]);
        
        // Add any text before the code block as a paragraph
        if (parts[0].trim()) {
          sections.push({ type: 'paragraph', content: parts[0].trim() });
        }
        
        // Add the code block
        sections.push({ type: 'code', content: codeBlocks[codeIndex] });
        
        // Add any text after the code block as a paragraph
        if (parts[1] && parts[1].trim()) {
          sections.push({ type: 'paragraph', content: parts[1].trim() });
        }
        
        continue;
      }
    }
    
    // Handle Before/After code examples 
    if (paragraph.includes('Before:') && paragraph.includes('After:')) {
      // This is likely a before/after code example
      const beforeAfterParts = paragraph.split(/Before:|After:/g).filter(p => p.trim());
      
      if (beforeAfterParts.length === 2) {
        sections.push({ type: 'heading', content: 'Before:' });
        sections.push({ type: 'code', content: beforeAfterParts[0].trim() });
        sections.push({ type: 'heading', content: 'After:' });
        sections.push({ type: 'code', content: beforeAfterParts[1].trim() });
        continue;
      }
    }
    
    // Check if this is standalone code (has HTML tags or CSS)
    // More precise detection to avoid capturing regular text
    const isLikelyCode = (text: string): boolean => {
      // Count code indicators
      const codeIndicators = [
        text.includes('<') && text.includes('>'), // HTML tags
        text.includes('{') && text.includes('}') && (text.includes(':') || text.includes(';')), // CSS
        /\bfunction\s+\w+\s*\(/.test(text), // function declaration
        /\bconst\s+|let\s+|var\s+/.test(text) && /[={[]/.test(text), // variable declarations
        /\bclass\s+\w+/.test(text), // class declaration
        /\bimport\s+/.test(text) && /\bfrom\b/.test(text), // import statement
        /\<\/?[a-z][\s\S]*\>/i.test(text), // HTML tag
        text.includes('<!DOCTYPE html>'),
        /\.[a-z]+\(/.test(text) // method call
      ];
      
      // Count language keywords
      const langKeywords = [
        /\bif\s*\(/.test(text),
        /\bfor\s*\(/.test(text),
        /\bwhile\s*\(/.test(text),
        /\breturn\s+/.test(text),
        /\bawait\s+/.test(text),
        /\basync\s+/.test(text)
      ];
      
      // Text that's likely not code
      const notCodeIndicators = [
        text.split(' ').length > 20 && !text.includes('\n'), // Long single line of text
        /[.!?]\s+[A-Z]/.test(text), // Sentences with proper punctuation and capitalization
        text.split(/[.!?]/).length > 3, // Multiple sentences
        /you should|we need to|it is important|please/i.test(text) // Instructional language
      ];
      
      // Count indicators
      const codeScore = codeIndicators.filter(Boolean).length + langKeywords.filter(Boolean).length;
      const notCodeScore = notCodeIndicators.filter(Boolean).length;
      
      return codeScore > 1 && codeScore > notCodeScore;
    };
    
    if (isLikelyCode(paragraph)) {
      sections.push({ type: 'code', content: paragraph.trim() });
      continue;
    }
    
    // Check if this is a heading (short and declarative)
    if (paragraph.length < 60 && (paragraph.trim().endsWith(':') || paragraph.split('\n')[0].endsWith(':'))) {
      const headingContent = paragraph.split('\n')[0]; // Only use first line if multiple
      sections.push({ type: 'heading', content: headingContent });
      
      // If there's content after the heading, add it as a paragraph
      const remainingContent = paragraph.split('\n').slice(1).join('\n').trim();
      if (remainingContent) {
        sections.push({ type: 'paragraph', content: remainingContent });
      }
      continue;
    }
    
    // Default to paragraph
    sections.push({ type: 'paragraph', content: paragraph });
  }
  
  return sections;
} 