import { useRef } from 'react';
import { LevaButton } from '../LevaButton/LevaButton';
import { exportPreset, importPreset } from '../../utils/presetUtils';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import styles from './PresetControls.module.scss';
import { type useLevaControls } from '../../Controls';

export interface PresetControlsProps {
  controls: ReturnType<typeof useLevaControls>['controls'];
  controlsAPI: ReturnType<typeof useLevaControls>['controlsAPI'];
  lang: ReturnType<typeof useLevaControls>['lang'];
}

export const PresetControls = ({ controls, controlsAPI, lang }: PresetControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    exportPreset(controls, `liquid-glass-${timestamp}.json`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const preset = await importPreset(file);
      console.log('Preset loaded:', preset);

      if (typeof controlsAPI === 'function') {
        try {
          controlsAPI(preset.controls);
        } catch (err) {
          console.error(`Error setting preset values with leva:`, err);
        }
      } else {
        console.error('controlsAPI is not a function. Import may fail.', controlsAPI);
      }
      alert(lang['editor.importSuccessMessage']);
    } catch (err) {
      alert(lang['editor.importFailedMessage'](err instanceof Error ? err.message : 'Unknown error'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.presetControls}>
      <LevaButton onClick={handleExport} title="Export current preset">
        <FileDownloadOutlinedIcon style={{ fontSize: '14px', marginRight: '4px' }} />
        {lang['editor.export'] || 'Export'}
      </LevaButton>

      <LevaButton onClick={handleImportClick} title="Import preset from file">
        <FileUploadOutlinedIcon style={{ fontSize: '14px', marginRight: '4px' }} />
        {lang['editor.import'] || 'Import'}
      </LevaButton>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
