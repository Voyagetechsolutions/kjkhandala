import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface DateInputProps {
  id: string;
  value: string; // yyyy-mm-dd format
  onChange: (value: string) => void;
  min?: string; // yyyy-mm-dd format
  required?: boolean;
  className?: string;
}

export default function DateInput({ id, value, onChange, min, required, className }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Convert yyyy-mm-dd to dd-mm-yyyy for display
  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-');
      setDisplayValue(`${day}-${month}-${year}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    
    // Format as dd-mm-yyyy
    if (input.length >= 2) {
      input = input.slice(0, 2) + '-' + input.slice(2);
    }
    if (input.length >= 5) {
      input = input.slice(0, 5) + '-' + input.slice(5);
    }
    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    setDisplayValue(input);

    // Convert dd-mm-yyyy to yyyy-mm-dd for internal storage
    if (input.length === 10) {
      const [day, month, year] = input.split('-');
      const dateValue = `${year}-${month}-${day}`;
      
      // Validate date
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        onChange(dateValue);
      }
    } else if (input.length === 0) {
      onChange('');
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value; // yyyy-mm-dd
    onChange(dateValue);
    setShowPicker(false);
  };

  const handleBlur = () => {
    // Validate on blur
    if (displayValue.length === 10) {
      const [day, month, year] = displayValue.split('-');
      const dateValue = `${year}-${month}-${day}`;
      const date = new Date(dateValue);
      
      if (isNaN(date.getTime())) {
        setDisplayValue('');
        onChange('');
      }
    }
  };

  const handleCalendarClick = () => {
    hiddenInputRef.current?.showPicker?.();
  };

  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="dd-mm-yyyy"
        className={className || "w-full pr-10"}
        required={required}
        maxLength={10}
      />
      {/* Hidden native date picker */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleDatePickerChange}
        min={min}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
      />
      {/* Calendar icon - clickable to open picker */}
      <Calendar 
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors" 
        onClick={handleCalendarClick}
      />
    </div>
  );
}
