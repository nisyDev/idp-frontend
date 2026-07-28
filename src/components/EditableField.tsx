import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface EditableFieldProps {
    value: string;
    onChange: (value: string) => void;
    variant?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
    style?: React.CSSProperties;
    multiline?: boolean;
}

export default function EditableField({
    value,
    onChange,
    variant = 'p',
    style = {},
    multiline = false
}: EditableFieldProps) {
    const { theme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        onChange(tempValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleSave();
        }
        if (e.key === 'Escape') {
            setTempValue(value);
            setIsEditing(false);
        }
    };

    const commonStyles: React.CSSProperties = {
        ...style,
        cursor: isEditing ? 'text' : 'pointer',
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        padding: isEditing ? '8px 12px' : '2px 4px',
        borderRadius: isEditing ? '6px' : '2px',
        backgroundColor: isEditing ? theme.mode === 'dark' ? '#1E293B' : '#F9FAFB' : 'transparent',
        border: isEditing ? `1px solid ${theme.inputBorder}` : '1px solid transparent',
    };

    if (isEditing) {
        return multiline ? (
            <textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                style={{
                    ...commonStyles,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                    minHeight: '80px',
                    resize: 'vertical',
                    outline: 'none',
                } as React.CSSProperties}
                autoFocus
            />
        ) : (
            <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                style={{
                    ...commonStyles,
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    color: theme.text,
                    backgroundColor: theme.inputBackground,
                    width: '100%',
                    border: `1px solid ${theme.inputBorder}`,
                    outline: 'none',
                } as React.CSSProperties}
                autoFocus
            />
        );
    }

    const Tag = variant as keyof JSX.IntrinsicElements;
    
    return (
        <Tag
            onClick={() => {
                setIsEditing(true);
                setTempValue(value);
            }}
            style={{
                ...commonStyles,
                userSelect: 'none',
            } as React.CSSProperties}
            title="Clique para editar"
        >
            {value}
        </Tag>
    );
}
