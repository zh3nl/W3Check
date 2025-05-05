'use client';

import React from 'react';

interface AISuggestionProps {
  suggestion: string;
}

export default function AISuggestion({ suggestion }: AISuggestionProps) {
  if (!suggestion) {
    return <p className="text-sm text-gray-500 italic">No AI suggestion available</p>;
  }

  // Preprocess the suggestion to split it into sections
  const sections = processSuggestion(suggestion);

  return (
    <div className="text-sm space-y-4 text-gray-800">
      {sections.map((section, index) => {
        // Check if this section is code
        if (section.type === 'code') {
          return (
            <div key={index} className="bg-gray-50 p-3 rounded-md font-mono text-xs overflow-x-auto border border-gray-200">
              {section.content.split('\n').map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          );
        }
        
        // Check if this is a heading/subheading
        if (section.type === 'heading') {
          return <h4 key={index} className="font-medium text-blue-700 mt-4">{section.content}</h4>;
        }
        
        // Normal paragraph
        return (
          <p key={index} className="whitespace-pre-wrap">
            {section.content}
          </p>
        );
      })}
    </div>
  );
}

type SectionType = 'paragraph' | 'code' | 'heading';
interface Section {
  type: SectionType;
  content: string;
}

function processSuggestion(suggestion: string): Section[] {
  const sections: Section[] = [];
  
  // Split by double newlines to separate paragraphs
  const rawParagraphs = suggestion.split(/\n\n+/);
  
  for (const paragraph of rawParagraphs) {
    // Skip empty paragraphs
    if (!paragraph.trim()) continue;
    
    // Determine the type of paragraph
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
    
    // Check if this is code (has HTML tags or CSS)
    if (
      (paragraph.includes('<') && paragraph.includes('>')) || 
      paragraph.includes('{') && paragraph.includes('}') ||
      paragraph.trim().startsWith('```') ||
      paragraph.includes('function')
    ) {
      // Extract code from markdown code blocks if present
      const codeContent = paragraph.replace(/```\w*\n?|\n?```/g, '').trim();
      sections.push({ type: 'code', content: codeContent });
      continue;
    }
    
    // Check if this is a heading (short, ends with colon)
    if (paragraph.length < 50 && paragraph.trim().endsWith(':')) {
      sections.push({ type: 'heading', content: paragraph });
      continue;
    }
    
    // Default to paragraph
    sections.push({ type: 'paragraph', content: paragraph });
  }
  
  return sections;
} 