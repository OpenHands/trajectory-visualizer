/**
 * Regression test for issue #53: "Trajectory visualizer deploy is broken".
 *
 * The deployed site rendered totally unstyled because the Tailwind v3 → v4
 * dependency upgrade left the project with v3 syntax in `src/index.css`
 * (`@tailwind base/components/utilities`) and a CommonJS `tailwind.config.js`.
 * Tailwind v4 silently produced a CSS file containing only the bare preflight
 * (no utility classes other than `.flex`), so every `bg-white`, `p-4`,
 * `text-lg`, etc. used in the JSX had no styles to apply.
 *
 * This test runs `vite build` and then verifies the generated CSS bundle
 * contains a representative sample of utility classes that the app actually
 * uses. If Tailwind is misconfigured again, this test will fail before the
 * site is ever deployed.
 */
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

const projectRoot = resolve(__dirname, '..', '..');
const buildDir = join(projectRoot, 'build');

describe('Tailwind production build', () => {
  let css = '';

  beforeAll(() => {
    // Fresh build so the test is hermetic.
    rmSync(buildDir, { recursive: true, force: true });
    execSync('npx vite build', {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });

    const assetsDir = join(buildDir, 'assets');
    const cssFile = readdirSync(assetsDir).find((f) => f.endsWith('.css'));
    if (!cssFile) {
      throw new Error(`No CSS bundle found in ${assetsDir}`);
    }
    css = readFileSync(join(assetsDir, cssFile), 'utf-8');
  }, 120_000);

  it('emits a Tailwind-generated CSS bundle', () => {
    // The Tailwind v4 banner appears at the top of every successful build.
    expect(css).toMatch(/tailwindcss v\d/);
  });

  it('includes the utility classes the app actually uses', () => {
    // A representative cross-section of classes used in the JSX. If any of
    // these are missing the deployed site will render unstyled.
    const requiredUtilities = [
      '.flex',
      '.bg-white',
      '.font-bold',
      '.text-2xl',
      '.p-4',
      '.w-12',
      '.h-12',
      '.rounded-lg',
      '.text-gray-900',
      '.border',
    ];
    for (const cls of requiredUtilities) {
      expect(
        css,
        `Expected built CSS to contain Tailwind utility "${cls}". ` +
          `If this fails, Tailwind is not scanning source files correctly ` +
          `(see src/index.css @source directives and @import "tailwindcss").`,
      ).toContain(cls);
    }
  });

  it('includes dark-mode and plugin variants', () => {
    // Class-based dark mode (`@custom-variant dark`) and the Tailwind plugins
    // (`@tailwindcss/typography`, `tailwind-scrollbar`) must all be wired up.
    expect(css, 'class-based dark mode missing').toContain('.dark');
    expect(css, '@tailwindcss/typography plugin missing').toContain('.prose');
    expect(css, 'tailwind-scrollbar plugin missing').toContain('.scrollbar');
  });

  it('produces a non-trivially-sized CSS bundle', () => {
    // The broken Tailwind-v4 build emitted ~14 kB of preflight-only CSS.
    // A correctly configured build is >50 kB for this app.
    expect(css.length).toBeGreaterThan(40_000);
  });
});
