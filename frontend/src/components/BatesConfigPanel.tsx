import { useState, useEffect } from 'react';
import { Minus, Plus, Hash, Type, AlignLeft, AlignCenter, AlignRight, Palette, Settings } from 'lucide-react';

interface BatesConfigPanelProps {
  initialConfig?: Partial<BatesConfig>;
  onChange: (config: BatesConfig) => void;
  disabled?: boolean;
}

export interface BatesConfig {
  prefix: string;
  startNumber: number;
  fontSize: number;
  position: 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';
  color: string;
  fontName: 'helv' | 'tiro' | 'cour' | 'symb' | 'zadb';
}

const DEFAULT_CONFIG: BatesConfig = {
  prefix: '',
  startNumber: 1,
  fontSize: 12,
  position: 'bottom_center',
  color: '#000000',
  fontName: 'helv',
};

const POSITIONS = [
  { value: 'top_left', label: 'Top Left', icon: AlignLeft },
  { value: 'top_center', label: 'Top Center', icon: AlignCenter },
  { value: 'top_right', label: 'Top Right', icon: AlignRight },
  { value: 'bottom_left', label: 'Bottom Left', icon: AlignLeft },
  { value: 'bottom_center', label: 'Bottom Center', icon: AlignCenter },
  { value: 'bottom_right', label: 'Bottom Right', icon: AlignRight },
] as const;

const FONTS = [
  { value: 'helv', label: 'Helvetica' },
  { value: 'tiro', label: 'Times Roman' },
  { value: 'cour', label: 'Courier' },
  { value: 'symb', label: 'Symbol' },
  { value: 'zadb', label: 'ZapfDingbats' },
] as const;

export function BatesConfigPanel({ initialConfig, onChange, disabled = false }: BatesConfigPanelProps) {
  const [config, setConfig] = useState<BatesConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  }));

  // Notify parent of changes
  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  const updateConfig = (updates: Partial<BatesConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const incrementNumber = () => updateConfig({ startNumber: config.startNumber + 1 });
  const decrementNumber = () => updateConfig({ startNumber: Math.max(1, config.startNumber - 1) });

  return (
    <div className="card tool-config">
      <div className="card-header">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Settings className="w-5 h-5" />
          Bates Stamp Configuration
        </h3>
      </div>
      <div className="card-body space-y-5">
        {/* Prefix */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Prefix
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., DOC-"
            value={config.prefix}
            onChange={e => updateConfig({ prefix: e.target.value.slice(0, 50) })}
            disabled={disabled}
            maxLength={50}
            aria-describedby="prefix-hint"
          />
          <p id="prefix-hint" className="text-sm text-muted mt-1">
            Optional text before the number (max 50 characters)
          </p>
        </div>

        {/* Start Number */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Type className="w-4 h-4" />
            Starting Number
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={decrementNumber}
              disabled={disabled || config.startNumber <= 1}
              aria-label="Decrease starting number"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              className="form-input text-center w-32"
              value={config.startNumber}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) updateConfig({ startNumber: val });
              }}
              onBlur={e => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 1) updateConfig({ startNumber: 1 });
              }}
              min={1}
              max={999999}
              disabled={disabled}
              aria-describedby="start-number-hint"
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={incrementNumber}
              disabled={disabled}
              aria-label="Increase starting number"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p id="start-number-hint" className="text-sm text-muted mt-1">
            First Bates number (1-999999)
          </p>
        </div>

        {/* Font Size */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font Size ({config.fontSize}pt)
          </label>
          <input
            type="range"
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            min={6}
            max={72}
            step={1}
            value={config.fontSize}
            onChange={e => updateConfig({ fontSize: parseInt(e.target.value, 10) })}
            disabled={disabled}
            aria-describedby="font-size-hint"
          />
          <p id="font-size-hint" className="text-sm text-muted mt-1 text-center">
            Font size in points (6-72)
          </p>
        </div>

        {/* Position */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <AlignCenter className="w-4 h-4" />
            Position on Page
          </label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Position options">
            {POSITIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={config.position === value}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  config.position === value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && updateConfig({ position: value })}
                disabled={disabled}
              >
                <div className="flex justify-center mb-1">
                  <Icon className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-xs font-medium text-center block">{label}</span>
                {config.position === value && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
              value={config.color}
              onChange={e => updateConfig({ color: e.target.value })}
              disabled={disabled}
              aria-label="Pick color"
            />
            <input
              type="text"
              className="form-input flex-1 font-mono text-sm"
              value={config.color}
              onChange={e => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  updateConfig({ color: e.target.value });
                }
              }}
              disabled={disabled}
              placeholder="#000000"
              pattern="#[0-9A-Fa-f]{6}"
              aria-describedby="color-hint"
            />
          </div>
          <p id="color-hint" className="text-sm text-muted mt-1">
            Hex color code (e.g., #000000 for black)
          </p>
        </div>

        {/* Font */}
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Type className="w-4 h-4" />
            Font
          </label>
          <select
            className="form-select"
            value={config.fontName}
            onChange={e => updateConfig({ fontName: e.target.value as BatesConfig['fontName'] })}
            disabled={disabled}
            aria-describedby="font-hint"
          >
            {FONTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <p id="font-hint" className="text-sm text-muted mt-1">
            Standard PDF fonts (embedded automatically)
          </p>
        </div>

        {/* Preview */}
        <div className="form-group p-4 bg-gray-50 rounded-lg border">
          <label className="form-label">Preview</label>
          <div className="font-mono text-sm" style={{ fontSize: `${Math.max(10, Math.min(config.fontSize, 20))}px`, color: config.color }}>
            {config.prefix}{String(config.startNumber).padStart(6, '0')}
          </div>
          <p className="text-xs text-muted mt-1">
            Example: Page 1 will show this, Page 2 will be {config.prefix}{String(config.startNumber + 1).padStart(6, '0')}, etc.
          </p>
        </div>
      </div>
    </div>
  );
}