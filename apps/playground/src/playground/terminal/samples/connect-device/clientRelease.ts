const repository = 'virgo-galaxy/virgo-terminal';
const clientTag = /^local-client-v\d+\.\d+\.\d+$/;
const pageSize = 100;

export interface ClientDownload {
  url: string;
  version: string;
}

interface Release {
  tag_name: string;
  draft: boolean;
  published_at: string | null;
  assets: { name: string; state: string }[];
}

export async function getLatestClientDownload(filename: string): Promise<ClientDownload | null> {
  const signal = AbortSignal.timeout(10_000);
  let latest: Release | undefined;

  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${repository}/releases?per_page=${pageSize}&page=${page}`,
      { cache: 'no-store', signal },
    );
    if (!response.ok) throw new Error(`GitHub releases returned HTTP ${response.status}`);

    const releases: Release[] = await response.json();
    for (const release of releases) {
      if (release.draft || !release.published_at || !clientTag.test(release.tag_name)) continue;
      if (!latest || release.tag_name.localeCompare(latest.tag_name, 'en', { numeric: true }) > 0) {
        latest = release;
      }
    }
    if (releases.length < pageSize) break;
  }

  if (!latest?.assets.some((asset) => asset.name === filename && asset.state === 'uploaded')) return null;

  return {
    url: `https://github.com/${repository}/releases/download/${latest.tag_name}/${encodeURIComponent(filename)}`,
    version: latest.tag_name.slice('local-client-'.length),
  };
}
