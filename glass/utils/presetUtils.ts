import { type useLevaControls } from '../Controls';
export interface PresetData {
  version: string;
  timestamp: string;
  controls: ReturnType<typeof useLevaControls>['controls'];
}

export function exportPreset(
  controls: ReturnType<typeof useLevaControls>['controls'],
  filename: string = 'liquid-glass-preset.json',
): void {
  const preset: PresetData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    controls: structuredClone(controls),
  };

  const jsonStr = JSON.stringify(preset, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importPreset(file: File): Promise<PresetData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const preset = JSON.parse(content) as PresetData;

        if (!preset.version || !preset.controls) {
          reject(new Error('Invalid preset file format'));
          return;
        }

        resolve(preset);
      } catch (err) {
        reject(new Error(`Failed to parse preset file: ${err}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
