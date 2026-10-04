import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Hash, AlignLeft } from 'lucide-react';

interface TagInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  badgeColor?: 'blue' | 'indigo' | 'emerald' | 'purple' | 'slate';
}

export const TagInput: React.FC<TagInputProps> = ({
  items = [],
  onChange,
  placeholder = 'Type item and press comma or Enter...',
  suggestions = [],
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTextMode, setIsTextMode] = useState(false);
  const [localText, setLocalText] = useState(items.join(', '));
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize localText when items change externally
  useEffect(() => {
    const currentParsed = localText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const arraysMatch =
      items.length === currentParsed.length &&
      items.every((val, index) => val === currentParsed[index]);

    if (!arraysMatch) {
      setLocalText(items.join(', '));
    }
  }, [items]);

  const addItems = (rawInput: string) => {
    if (!rawInput.trim()) return;
    const pieces = rawInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (pieces.length === 0) return;

    const existingLower = new Set(items.map(i => i.toLowerCase()));
    const newItems = [...items];

    pieces.forEach(piece => {
      if (!existingLower.has(piece.toLowerCase())) {
        newItems.push(piece);
        existingLower.add(piece.toLowerCase());
      }
    });

    onChange(newItems);
    setInputValue('');
  };

  const removeItem = (indexToRemove: number) => {
    const updated = items.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.includes(',')) {
      addItems(val);
    } else {
      setInputValue(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addItems(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && items.length > 0) {
      removeItem(items.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addItems(inputValue);
    }
  };

  const handleTextModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);

    const parsed = raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  const toggleMode = () => {
    if (!isTextMode) {
      setLocalText(items.join(', '));
    } else {
      setInputValue('');
    }
    setIsTextMode(!isTextMode);
  };

  const unusedSuggestions = suggestions.filter(
    s => !items.some(item => item.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        {isTextMode ? (
          <div className="relative flex items-center">
            <input
              type="text"
              value={localText}
              onChange={handleTextModeChange}
              placeholder="e.g. Python, TypeScript, Docker, AWS"
              className="w-full bg-white border border-[#DEDEDE] pl-3 pr-20 py-1.5 text-xs text-[#222222] placeholder-[#888888] focus:outline-none focus:border-[#222222] rounded-none"
            />
            <button
              type="button"
              onClick={toggleMode}
              className="absolute right-1.5 px-2 py-0.5 text-[10px] bg-[#F7F7F7] border border-[#DEDEDE] text-[#666666] hover:bg-[#EAEAEA] hover:text-[#222222] transition-colors flex items-center gap-1 rounded-none"
              title="Switch to Tag mode"
            >
              <Hash className="w-3 h-3 text-[#666666]" />
              <span>Tags</span>
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.focus()}
            className="min-h-[38px] w-full bg-white border border-[#DEDEDE] p-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-[#222222] cursor-text transition-colors rounded-none"
          >
            {items.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono border border-[#DEDEDE] bg-[#F7F7F7] text-[#222222] rounded-none"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(idx);
                  }}
                  className="hover:text-[#c62828] text-[#888888] p-0.5 transition-colors"
                  title={`Remove ${item}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={items.length === 0 ? placeholder : 'Add another...'}
              className="flex-1 min-w-[120px] bg-transparent border-none text-xs text-[#222222] placeholder-[#888888] focus:outline-none px-1 py-0.5"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMode();
              }}
              className="ml-auto px-2 py-0.5 text-[10px] bg-[#F7F7F7] border border-[#DEDEDE] text-[#666666] hover:bg-[#EAEAEA] hover:text-[#222222] transition-colors flex items-center gap-1 self-center rounded-none"
              title="Switch to Plain Text comma-separated mode"
            >
              <AlignLeft className="w-3 h-3 text-[#666666]" />
              <span>Text</span>
            </button>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <span className="text-[10px] text-[#888888] mr-1">Suggestions:</span>
          {unusedSuggestions.slice(0, 6).map((sugg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addItems(sugg)}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FFFFFF] hover:bg-[#F0F0F0] text-[#666666] hover:text-[#222222] text-[10px] font-mono border border-[#DEDEDE] transition-colors rounded-none"
            >
              <Plus className="w-2.5 h-2.5 text-[#888888]" />
              <span>{sugg}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
