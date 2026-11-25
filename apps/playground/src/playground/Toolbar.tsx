import { useState, type ReactNode } from 'react';
import { CodeIcon, FileTextIcon, GithubIcon, LanguageIcon, MonitorIcon, MoonFilledIcon, SunFilledIcon } from '@virgo-design/icons';
import { Button, Menu, SegmentedControl } from '@virgo-design/ui';
import terminalLogo from '@/assets/virgo-terminal-logo.svg';
import type { ExampleView } from '@/examples/types';
import { usePlaygroundLocale } from '@/i18n/PlaygroundLocale';

export function Toolbar({ view, onSelectExample, children }: {
  view: ExampleView;
  onSelectExample: (view: ExampleView) => void;
  children: ReactNode;
}) {
  const { locale, setLocale, t } = usePlaygroundLocale();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.dataset.theme === 'dark');
  const languageLabel = t('toolbar.language');
  const colorModeLabel = t(darkMode ? 'toolbar.switchToLight' : 'toolbar.switchToDark');

  function toggleColorMode() {
    const mode = darkMode ? 'light' : 'dark';
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.nshTheme = mode;
    setDarkMode(!darkMode);
  }

  return (
    <div className="toolbar">
      <img src={terminalLogo} alt="Virgo Terminal" width={24} height={24} />
      <SegmentedControl
        aria-label={t('toolbar.examples')}
        className="toolbar-examples"
        size="small"
        variant="soft"
        motion="slide"
        value={view}
        onValueChange={(value) => onSelectExample(value as ExampleView)}
      >
        <SegmentedControl.Item value="terminal" icon={<CodeIcon />}>{t('toolbar.terminal')}</SegmentedControl.Item>
        <SegmentedControl.Item value="logs" icon={<FileTextIcon />}>{t('toolbar.logs')}</SegmentedControl.Item>
        {import.meta.env.DEV && (
          <SegmentedControl.Item value="shell" icon={<MonitorIcon />}>{t('toolbar.shell')}</SegmentedControl.Item>
        )}
      </SegmentedControl>
      <div className="toolbar-actions">
        <Button
          type="button"
          size="small"
          variant="outline"
          iconOnly
          aria-label={colorModeLabel}
          title={colorModeLabel}
          onClick={toggleColorMode}
        >
          {darkMode ? <SunFilledIcon aria-hidden="true" /> : <MoonFilledIcon aria-hidden="true" />}
        </Button>
        <Menu size="small">
          <Menu.Trigger render={(props) => (
            <Button {...props} size="small" variant="outline" iconOnly aria-label={languageLabel} title={languageLabel}>
              <LanguageIcon aria-hidden="true" />
            </Button>
          )} />
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
        <Button
          type="button"
          size="small"
          variant="outline"
          iconOnly
          aria-label={t('toolbar.github')}
          title="GitHub"
          onClick={() => window.open('https://github.com/virgo-galaxy/virgo-terminal', '_blank', 'noopener,noreferrer')}
        >
          <GithubIcon aria-hidden="true" />
        </Button>
        {children}
      </div>
    </div>
  );
}
