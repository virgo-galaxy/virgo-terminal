import { SettingsIcon } from '@virgo-design/icons';
import { Button, Drawer, Select, Separator, Switch } from '@virgo-design/ui';
import type { CSSProperties } from 'react';
import { usePlaygroundLocale } from '@/app/i18n/PlaygroundLocale';
import type { ShellOption } from '@/examples/local-shell/useShellOptions';
import {
  defaultPreferences, fonts, historyLimits, scrollbarRadii, scrollbarWidths, sizes, themes, type TerminalPreferenceValues,
} from './preferences';

const themeOptions = Object.keys(themes) as Array<keyof typeof themes>;

export function TerminalPreferences({ preferences, shellOptions, onChange, onRestoreDefaults }: {
  preferences: TerminalPreferenceValues;
  shellOptions: ShellOption[];
  onChange: (change: Partial<TerminalPreferenceValues>) => void;
  onRestoreDefaults: () => void;
}) {
  const { locale, t } = usePlaygroundLocale();
  const {
    font, fontSize, theme, scrollbarVisibility, scrollbarWidth, scrollbarRadius, history, copyOnSelect, showBackToTop, shellId,
  } = preferences;

  return (
    <Drawer>
      <Drawer.Trigger
        render={(props) => (
          <Button {...props} size="small" variant="outline" iconOnly aria-label={t('preferences.title')}>
            <SettingsIcon aria-hidden="true" />
          </Button>
        )}
      />
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content placement="right" size="sm" style={{ '--drawer-size': '22.5rem' } as CSSProperties}>
          <Drawer.Header>
            <Drawer.Title>{t('preferences.title')}</Drawer.Title>
            <Drawer.Close aria-label={t('preferences.close')} />
          </Drawer.Header>
          <Drawer.Body className="preferences-body">
            <section className="preferences-section" aria-labelledby="appearance-heading">
              <h3 id="appearance-heading">{t('preferences.appearance')}</h3>
              <div className="preference-field">
                <span id="appearance-font">{t('preferences.font')}</span>
                <Select size="small" value={font} onValueChange={(value) => onChange({ font: value as keyof typeof fonts })}>
                  <Select.Trigger aria-labelledby="appearance-font" />
                  <Select.Content>
                    {Object.entries(fonts).map(([value, option]) => (
                      <Select.Option key={value} value={value}>{option.label ?? t('preferences.systemFont')}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="preference-field">
                <span id="appearance-size">{t('preferences.size')}</span>
                <Select size="small" value={fontSize} onValueChange={(value) => onChange({ fontSize: value })}>
                  <Select.Trigger aria-labelledby="appearance-size" />
                  <Select.Content>
                    {sizes.map((size) => <Select.Option key={size} value={String(size)}>{size} px</Select.Option>)}
                  </Select.Content>
                </Select>
              </div>
              <div className="preference-field">
                <span id="appearance-theme">{t('preferences.theme')}</span>
                <Select size="small" value={theme} onValueChange={(value) => onChange({ theme: value as keyof typeof themes })}>
                  <Select.Trigger aria-labelledby="appearance-theme" />
                  <Select.Content>
                    {themeOptions.map((value) => (
                      <Select.Option key={value} value={value}>{t(`preferences.theme.${value}`)}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="preferences-section scrollbar-preferences" role="group" aria-labelledby="scrollbar-heading">
                <h4 id="scrollbar-heading">{t('preferences.scrollbar')}</h4>
                <div className="preference-field">
                  <span id="scrollbar-display">{t('preferences.display')}</span>
                  <Select size="small" value={scrollbarVisibility} onValueChange={(value) => onChange({ scrollbarVisibility: value as TerminalPreferenceValues['scrollbarVisibility'] })}>
                    <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-display" />
                    <Select.Content>
                      <Select.Option value="auto">{t('preferences.automatic')}</Select.Option>
                      <Select.Option value="hidden">{t('preferences.hidden')}</Select.Option>
                    </Select.Content>
                  </Select>
                </div>
                <div className="preference-field">
                  <span id="scrollbar-width">{t('preferences.width')}</span>
                  <Select size="small" value={scrollbarWidth} onValueChange={(value) => onChange({ scrollbarWidth: value })}>
                    <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-width" />
                    <Select.Content>
                      {scrollbarWidths.map((width) => <Select.Option key={width} value={String(width)}>{width} px</Select.Option>)}
                    </Select.Content>
                  </Select>
                </div>
                <div className="preference-field">
                  <span id="scrollbar-radius">{t('preferences.radius')}</span>
                  <Select size="small" value={scrollbarRadius} onValueChange={(value) => onChange({ scrollbarRadius: value })}>
                    <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-radius" />
                    <Select.Content>
                      {scrollbarRadii.map((radius) => <Select.Option key={radius} value={String(radius)}>{radius} px</Select.Option>)}
                    </Select.Content>
                  </Select>
                </div>
              </div>
            </section>
            <Separator decorative />
            <section className="preferences-section" aria-labelledby="settings-heading">
              <h3 id="settings-heading">{t('preferences.settings')}</h3>
              <Switch className="preference-switch" checked={copyOnSelect} onCheckedChange={(checked) => onChange({ copyOnSelect: checked })}>
                {t('preferences.copyOnSelect')}
              </Switch>
              <Switch className="preference-switch" checked={showBackToTop} onCheckedChange={(checked) => onChange({ showBackToTop: checked })}>
                {t('preferences.backToTopInLogs')}
              </Switch>
              <div className="preference-field">
                <span id="history-label">{t('preferences.history')}</span>
                <Select size="small" value={history} onValueChange={(value) => onChange({ history: value })}>
                  <Select.Trigger aria-labelledby="history-label" />
                  <Select.Content>
                    {historyLimits.map((limit) => (
                      <Select.Option key={limit} value={String(limit)}>
                        {limit === 0
                          ? t('preferences.screenOnly')
                          : t('preferences.historyLines').replace('{count}', limit.toLocaleString(locale))}
                      </Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              {import.meta.env.DEV && (
                <>
                  <div className="preference-field">
                    <span id="local-shell-label">{t('preferences.shell')}</span>
                    <Select size="small" value={shellId} onValueChange={(value) => onChange({ shellId: value })}>
                      <Select.Trigger aria-labelledby="local-shell-label" aria-describedby="local-shell-hint" />
                      <Select.Content>
                        {shellOptions.map(({ id, label }) => (
                          <Select.Option key={id} value={id}>
                            {id === defaultPreferences.shellId ? label.replace(/^System default/, t('preferences.systemDefault')) : label}
                          </Select.Option>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                  <p id="local-shell-hint" className="shell-preference-hint">{t('preferences.shellHint')}</p>
                </>
              )}
            </section>
          </Drawer.Body>
          <Drawer.Footer>
            <Button type="button" size="small" variant="outline" onClick={onRestoreDefaults}>
              {t('preferences.restoreDefaults')}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer>
  );
}
