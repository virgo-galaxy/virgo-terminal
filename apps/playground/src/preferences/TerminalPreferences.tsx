import { SettingsIcon } from '@virgo-design/icons';
import { Button, Drawer, Select, Separator, Switch } from '@virgo-design/ui';
import type { ShellOption } from '@/examples/local-shell/useShellOptions';
import {
  fonts, historyLimits, scrollbarRadii, scrollbarWidths, sizes, themes, type TerminalPreferenceValues,
} from './preferences';

export function TerminalPreferences({ preferences, shellOptions, onChange, onRestoreDefaults }: {
  preferences: TerminalPreferenceValues;
  shellOptions: ShellOption[];
  onChange: (change: Partial<TerminalPreferenceValues>) => void;
  onRestoreDefaults: () => void;
}) {
  const {
    font, fontSize, theme, scrollbarVisibility, scrollbarWidth, scrollbarRadius, history, copyOnSelect, showBackToTop, shellId,
  } = preferences;

  return (
    <Drawer>
      <Drawer.Trigger
        render={(props) => (
          <Button {...props} size="small" variant="outline" iconOnly aria-label="Terminal preferences">
            <SettingsIcon aria-hidden="true" />
          </Button>
        )}
      />
      <Drawer.Portal>
        <Drawer.Overlay />
        <Drawer.Content placement="right" size="sm">
          <Drawer.Header>
            <Drawer.Title>Terminal preferences</Drawer.Title>
            <Drawer.Close aria-label="Close preferences" />
          </Drawer.Header>
          <Drawer.Body className="preferences-body">
            <section className="preferences-section" aria-labelledby="appearance-heading">
              <h3 id="appearance-heading">Appearance</h3>
              <div className="preference-field">
                <span id="appearance-font">Font</span>
                <Select size="small" value={font} onValueChange={(value) => onChange({ font: value as keyof typeof fonts })}>
                  <Select.Trigger aria-labelledby="appearance-font" />
                  <Select.Content>
                    {Object.entries(fonts).map(([value, option]) => (
                      <Select.Option key={value} value={value}>{option.label}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="preference-field">
                <span id="appearance-size">Size</span>
                <Select size="small" value={fontSize} onValueChange={(value) => onChange({ fontSize: value })}>
                  <Select.Trigger aria-labelledby="appearance-size" />
                  <Select.Content>
                    {sizes.map((size) => <Select.Option key={size} value={String(size)}>{size} px</Select.Option>)}
                  </Select.Content>
                </Select>
              </div>
              <div className="preference-field">
                <span id="appearance-theme">Theme</span>
                <Select size="small" value={theme} onValueChange={(value) => onChange({ theme: value as keyof typeof themes })}>
                  <Select.Trigger aria-labelledby="appearance-theme" />
                  <Select.Content>
                    {Object.entries(themes).map(([value, option]) => (
                      <Select.Option key={value} value={value}>{option.label}</Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="preferences-section scrollbar-preferences" role="group" aria-labelledby="scrollbar-heading">
                <h4 id="scrollbar-heading">Scrollbar</h4>
                <div className="preference-field">
                  <span id="scrollbar-display">Display</span>
                  <Select size="small" value={scrollbarVisibility} onValueChange={(value) => onChange({ scrollbarVisibility: value as TerminalPreferenceValues['scrollbarVisibility'] })}>
                    <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-display" />
                    <Select.Content>
                      <Select.Option value="auto">Automatic</Select.Option>
                      <Select.Option value="hidden">Hidden</Select.Option>
                    </Select.Content>
                  </Select>
                </div>
                <div className="preference-field">
                  <span id="scrollbar-width">Width</span>
                  <Select size="small" value={scrollbarWidth} onValueChange={(value) => onChange({ scrollbarWidth: value })}>
                    <Select.Trigger aria-labelledby="scrollbar-heading scrollbar-width" />
                    <Select.Content>
                      {scrollbarWidths.map((width) => <Select.Option key={width} value={String(width)}>{width} px</Select.Option>)}
                    </Select.Content>
                  </Select>
                </div>
                <div className="preference-field">
                  <span id="scrollbar-radius">Radius</span>
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
              <h3 id="settings-heading">Settings</h3>
              <Switch className="preference-switch" checked={copyOnSelect} onCheckedChange={(checked) => onChange({ copyOnSelect: checked })}>
                Copy on select
              </Switch>
              <Switch className="preference-switch" checked={showBackToTop} onCheckedChange={(checked) => onChange({ showBackToTop: checked })}>
                Back to top in logs
              </Switch>
              <div className="preference-field">
                <span id="history-label">History</span>
                <Select size="small" value={history} onValueChange={(value) => onChange({ history: value })}>
                  <Select.Trigger aria-labelledby="history-label" />
                  <Select.Content>
                    {historyLimits.map((limit) => (
                      <Select.Option key={limit} value={String(limit)}>
                        {limit === 0 ? 'Screen only' : `${limit.toLocaleString('en-US')} lines`}
                      </Select.Option>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              {import.meta.env.DEV && (
                <>
                  <div className="preference-field">
                    <span id="local-shell-label">Shell</span>
                    <Select size="small" value={shellId} onValueChange={(value) => onChange({ shellId: value })}>
                      <Select.Trigger aria-labelledby="local-shell-label" aria-describedby="local-shell-hint" />
                      <Select.Content>
                        {shellOptions.map(({ id, label }) => (
                          <Select.Option key={id} value={id}>{label}</Select.Option>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>
                  <p id="local-shell-hint" className="shell-preference-hint">Applies to the next shell session.</p>
                </>
              )}
            </section>
          </Drawer.Body>
          <Drawer.Footer>
            <Button type="button" size="small" variant="outline" onClick={onRestoreDefaults}>
              Restore defaults
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer>
  );
}
