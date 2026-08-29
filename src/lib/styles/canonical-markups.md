---
title: Canonical Markups
description: Source of truth for shell and layout markups
---

> Transcribed from registry-v1.md (L4 ruling: "an L4 class without a canonical markup is an incomplete definition"). Implementation status is noted per section against `src/lib/styles/`.

## 1 - Canonical App Shell and Children

```html
<div class="app-shell">
	<header class="app-header"></header>
	<main class="app-main">
		<aside class="sidebar-left"></aside>
		<section class="main-section">
			<article class="content-shell"></article>
		</section>
		<aside class="sidebar-right"></aside>
	</main>
	<footer class="app-footer"></footer>
</div>
```

| Class | Responsibility |
|---|---|
| `.app-shell` | min-height fill; column; publishes `--header-height` |
| `.app-header` | fixed-height bar (sticky), `height: var(--header-height)` |
| `.app-main` | the row below the header; `min-height: calc(100vh - var(--header-height))` |
| `.sidebar-left` / `.sidebar-right` | sticky columns; `top: var(--header-height)`; width from `--sidebar-width`; dress your own bg |
| `.main-section` | `min-width: 0`; owns horizontal padding via `.page-main` semantics |
| `.content-shell` | max-width content column inside main-section |
| `.app-footer` | full-width footer bar |

Status: **implemented** — `_05_shells.sass`.

## 2 - Canonical Docs and Children

`.docs` is a config modifier on `.app-shell`: left sidebar retracts below the seam (header menu button toggles `.open`), right TOC contracts to `.docs-mobile-toc`.

```html
<div class="app-shell docs">
	<header class="app-header">
		<button class="button is-icon" aria-expanded="false" aria-label="Menu"></button>
	</header>
	<main class="app-main">
		<aside class="sidebar-left">
			<nav class="navtree">
				<div class="navtree-group">
					<div class="navtree-title"></div>
					<a class="navtree-link" href="…"></a>
					<div class="navtree-sub"></div>
				</div>
			</nav>
		</aside>
		<section class="main-section">
			<article class="content-shell"></article>
		</section>
		<aside class="sidebar-right">
			<nav class="toc">
				<div class="toc-title"></div>
				<ul class="toc-list">
					<li><a class="toc-link" href="…"></a></li>
				</ul>
				<div class="toc-footer"></div>
			</nav>
		</aside>
	</main>
	<details class="docs-mobile-toc">
		<summary></summary>
	</details>
	<footer class="app-footer"></footer>
</div>
```

Tab strip, wherever it lives:

```html
<div class="tab-list" role="tablist">
	<button class="tab-trigger active" role="tab" aria-selected="true"></button>
</div>
```

Current tab = `.active`; triggers carry native `aria-selected`.

Status: `.docs` and `.docs-mobile-toc` **implemented** — `_05_shells.sass`. `.navtree*`, `.toc*`, `.tab-list`, `.tab-trigger` are **registered but not yet in the styles** (definitions to be transcribed at build, per registry L4).

## 3 - Canonical Sidebar with Accordions

```html
<aside class="page-sidebar">
	<div class="accordion">
		<div class="accordion-item open">
			<button class="accordion-trigger" aria-expanded="true"></button>
			<div class="accordion-content">
				<a class="navtree-link" href="…"></a>
			</div>
		</div>
		<div class="accordion-item">
			<button class="accordion-trigger" aria-expanded="false"></button>
			<div class="accordion-content"></div>
		</div>
	</div>
</aside>
```

`.open` on `.accordion-item` shows the content; triggers carry native `aria-expanded`.

Status: accordion family **implemented** — `_05_shells.sass`.

## 4 - Canonical Page Frames

```html
<!-- plain page: padded content frame -->
<section class="page-shell"> … </section>

<!-- sidebar page: full-bleed split, padding lives in .page-main -->
<section class="page-split">
	<aside class="page-sidebar"></aside>
	<main class="page-main"></main>
</section>
```

Status: **implemented** — `_05_shells.sass`.

## 5 - Canonical Hero

```html
<section class="hero">
	<h1 class="text-3xl"></h1>
	<p class="text-lg text-muted"></p>
</section>
```

Status: **implemented** — `_05_shells.sass` (documented sugar: `.box.ycenter` + `gap-lg` + `pad-y-xl`).
