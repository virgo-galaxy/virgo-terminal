import { constants } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { basename, delimiter, isAbsolute, join } from 'node:path';

const windowsShells = [
  { id: 'cmd', label: 'CMD', executable: 'cmd.exe' },
  { id: 'pwsh', label: 'PowerShell (pwsh)', executable: 'pwsh.exe' },
  { id: 'powershell', label: 'Windows PowerShell', executable: 'powershell.exe' },
];

const unixShells = [
  { id: 'bash', label: 'Bash', executable: 'bash' },
  { id: 'zsh', label: 'Zsh', executable: 'zsh' },
  { id: 'dash', label: 'Dash', executable: 'dash' },
];

async function findExecutable(executable: string, directories: string[]) {
  for (const directory of directories) {
    const file = join(directory, executable);
    try {
      await access(file, constants.X_OK);
      if ((await stat(file)).isFile()) return file;
    } catch {
      // Continue looking in the remaining directories.
    }
  }
}

export async function detectLocalShells() {
  const windows = process.platform === 'win32';
  const candidates = windows ? windowsShells : unixShells;
  const defaultShell = windows ? process.env.ComSpec || 'cmd.exe' : process.env.SHELL || '/bin/sh';
  const defaultName = basename(defaultShell);
  const defaultCandidate = candidates.find(({ executable }) => executable === defaultName.toLowerCase());
  const directories = (process.env.PATH ?? '').split(delimiter).map((entry) => entry.replace(/^"(.*)"$/, '$1'));

  if (windows) {
    const systemRoot = process.env.SystemRoot;
    if (systemRoot) {
      directories.push(join(systemRoot, 'System32'), join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0'));
    }
    const programFiles = process.env.ProgramFiles;
    if (programFiles) directories.push(join(programFiles, 'PowerShell', '7'));
  } else {
    directories.push('/usr/local/bin', '/usr/bin', '/bin');
  }

  const searchPaths = [...new Set(directories.filter(isAbsolute))];
  const alternatives = await Promise.all(candidates
    .filter((candidate) => candidate !== defaultCandidate)
    .map(async ({ id, label, executable }) => {
      const file = await findExecutable(executable, searchPaths);
      return file ? { id, label, file } : undefined;
    }));

  return [
    { id: 'system', label: `System default (${defaultCandidate?.label ?? defaultName})`, file: defaultShell },
    ...alternatives.filter((shell) => shell !== undefined),
  ];
}
