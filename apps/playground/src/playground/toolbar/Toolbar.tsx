import { useState } from 'react';
import { CodeIcon, FileTextIcon, GithubIcon, LanguageIcon, MaximizeIcon, MonitorIcon, MonitorPlugIcon, MoonFilledIcon, SunFilledIcon } from '@virgo-design/icons';
import { Button, Menu, SegmentedControl } from '@virgo-design/ui';
import terminalLogo from '@/assets/virgo-terminal-logo.svg';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';
import { showLocalShellDemo, type PlaygroundView } from '../views';
import type { TerminalPreferenceValues } from './preferences/preferences';
import { TerminalPreferences } from './preferences/TerminalPreferences';
import { ToolbarTooltip } from './ToolbarTooltip';
import styles from './toolbar.module.css';

export function Toolbar({ view, onSelectExample, onConnectDevice, onFullscreen, preferences, onPreferencesChange, onRestoreDefaults }: {
  view: PlaygroundView;
  onSelectExample: (view: PlaygroundView) => void;
  onConnectDevice: () => void;
  onFullscreen?: (() => void) | undefined;
  preferences: TerminalPreferenceValues;
  onPreferencesChange: (change: Partial<TerminalPreferenceValues>) => void;
  onRestoreDefaults: () => void;
}) {
  const { locale, setLocale, t } = usePlaygroundLocale();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.dataset.theme === 'dark');
  const languageLabel = t('toolbar.language');
  const colorModeLabel = t(darkMode ? 'toolbar.switchToLight' : 'toolbar.switchToDark');
  const githubLabel = t('toolbar.github');
  const fullscreenLabel = t('toolbar.fullscreen');

  function toggleColorMode() {
    const mode = darkMode ? 'light' : 'dark';
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.nshTheme = mode;
    setDarkMode(!darkMode);
  }

  return (
    <div className={styles.toolbar}>
      <img src={terminalLogo} alt="Virgo Terminal" width={24} height={24} />
      <SegmentedControl
        aria-label={t('toolbar.examples')}
        className={styles.examples!}
        size="small"
        variant="soft"
        motion="slide"
        value={view}
        onValueChange={(value) => onSelectExample(value as PlaygroundView)}
      >
        <SegmentedControl.Item value="terminal" icon={<CodeIcon />}>{t('toolbar.terminal')}</SegmentedControl.Item>
        <SegmentedControl.Item value="logs" icon={<FileTextIcon />}>{t('toolbar.logs')}</SegmentedControl.Item>
        {showLocalShellDemo && (
          <SegmentedControl.Item value="shell" icon={<MonitorIcon />}>{t('toolbar.shell')}</SegmentedControl.Item>
        )}
        <SegmentedControl.Item value="connect-device" icon={<MonitorPlugIcon />} onClick={onConnectDevice}>
          {t('toolbar.connectDevice')}
        </SegmentedControl.Item>
      </SegmentedControl>
      <div className={styles.actions}>
        <ToolbarTooltip label={githubLabel}>
          <Button
            type="button"
            size="small"
            variant="outline"
            iconOnly
            aria-label={githubLabel}
            onClick={() => window.open('https://github.com/virgo-galaxy/virgo-terminal', '_blank', 'noopener,noreferrer')}
          >
            <GithubIcon aria-hidden="true" />
          </Button>
        </ToolbarTooltip>
        <Menu size="small">
          <ToolbarTooltip label={languageLabel}>
            <Menu.Trigger render={(props) => (
              <Button {...props} size="small" variant="outline" iconOnly aria-label={languageLabel}>
                <LanguageIcon aria-hidden="true" />
              </Button>
            )} />
          </ToolbarTooltip>
          <Menu.Content placement="bottomEnd">
            <Menu.RadioGroup
              aria-label={languageLabel}
              value={locale}
              onValueChange={(value) => setLocale(value === 'zh-CN' ? 'zh-CN' : 'en-US')}
            >
              <Menu.RadioItem value="en-US" closeOnSelect><span lang="en-US">English</span></Menu.RadioItem>
              <Menu.RadioItem value="zh-CN" closeOnSelect><span lang="zh-CN">简体中文</span></Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu>
        <ToolbarTooltip label={colorModeLabel}>
          <Button type="button" size="small" variant="outline" iconOnly aria-label={colorModeLabel} onClick={toggleColorMode}>
            {darkMode ? <SunFilledIcon aria-hidden="true" /> : <MoonFilledIcon aria-hidden="true" />}
          </Button>
        </ToolbarTooltip>
        <TerminalPreferences
          showShellSelection={showLocalShellDemo && view === 'shell'}
          preferences={preferences}
          onChange={onPreferencesChange}
          onRestoreDefaults={onRestoreDefaults}
        />
        {onFullscreen && (
          <ToolbarTooltip label={fullscreenLabel}>
            <Button type="button" size="small" variant="outline" iconOnly aria-label={fullscreenLabel} onClick={onFullscreen}>
              <MaximizeIcon aria-hidden="true" />
            </Button>
          </ToolbarTooltip>
        )}
      </div>
    </div>
  );
}
