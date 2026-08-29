<script lang="ts">
  import { tabStore, HOME_TAB_ID, type Tab } from "$lib/stores/tabs";
  import { newDocument } from "$lib/tauri/files";
  import { copyPath } from "$lib/utils/clipboard";

  let {
    onCloseTab = (id: string) => tabStore.closeTab(id),
  }: {
    onCloseTab?: (id: string) => void;
  } = $props();

  const { tabs, activeTabId } = tabStore;
  let dragIndex = $state(-1);
  let overIndex = $state(-1);
  let contextMenuTab = $state<Tab | null>(null);
  let contextMenuPos = $state({ x: 0, y: 0 });
  let copyFeedback = $state("");

  function handleClose(e: MouseEvent, id: string) {
    e.stopPropagation();
    onCloseTab(id);
  }

  function handleTabKeydown(e: KeyboardEvent, id: string) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    tabStore.switchTab(id);
  }

  function handleCloseKeydown(e: KeyboardEvent, id: string) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    e.stopPropagation();
    onCloseTab(id);
  }

  // Middle-click anywhere on a tab closes it, matching browsers/VS Code (#46).
  // Only clean tabs: a dirty tab needs the unsaved-changes dialog, and opening
  // that native modal from an auxclick handler wedges it in WKWebView (the modal
  // becomes unresponsive). So middle-click skips dirty tabs — the X button (a
  // plain click) still closes them with the prompt.
  function handleAuxClick(e: MouseEvent, id: string) {
    if (e.button !== 1) return;
    e.preventDefault();
    if ($tabs.find((t) => t.id === id)?.dirty) return;
    onCloseTab(id);
  }

  function handleMouseDown(e: MouseEvent, idx: number) {
    // Suppress the middle-button default (autoscroll) so the tab close on
    // auxclick fires cleanly on the first click (#46) — but don't close here;
    // closing on mousedown mis-fires as the row re-renders. Don't start a drag.
    if (e.button === 1) {
      e.preventDefault();
      return;
    }
    // Only the left button starts a drag.
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest(".tab-close") || (e.target as HTMLElement).closest(".dropdown")) return;
    e.preventDefault();
    dragIndex = idx;

    function handleMouseMove(ev: MouseEvent) {
      const tabbar = document.querySelector(".tabbar-files");
      if (!tabbar) return;
      const children = Array.from(tabbar.children) as HTMLElement[];
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        if (ev.clientX >= rect.left && ev.clientX < rect.right) {
          overIndex = i;
          break;
        }
      }
    }

    function handleMouseUp() {
      if (dragIndex >= 0 && overIndex >= 0 && dragIndex !== overIndex) {
        tabStore.reorderTabs(dragIndex, overIndex);
      }
      dragIndex = -1;
      overIndex = -1;
      (window as any).__fracta_tab_dragging = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    (window as any).__fracta_tab_dragging = true;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleNewTab() {
    newDocument();
  }

  // A tab backed by a real file has a canonical absolute path to copy; paste://,
  // url://, and not-yet-saved new:// tabs don't.
  function isFileTab(tab: Tab): boolean {
    return !!tab.filePath
      && !tab.filePath.startsWith("paste://")
      && !tab.filePath.startsWith("url://")
      && !tab.filePath.startsWith("new://");
  }

  function handleContextMenu(e: MouseEvent, tab: Tab) {
    if (!isFileTab(tab)) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 160;
    contextMenuPos = { x: Math.min(rect.left, window.innerWidth - menuWidth - 8), y: rect.bottom + 4 };
    contextMenuTab = tab;
    copyFeedback = "";
  }

  function closeContextMenu() {
    contextMenuTab = null;
    copyFeedback = "";
  }

  async function handleCopyPath() {
    if (!contextMenuTab) return;
    const success = await copyPath(contextMenuTab.filePath);
    copyFeedback = success ? "Copied!" : "Failed";
    setTimeout(closeContextMenu, 900);
  }
</script>
<div class="tabbar sticky row ycenter gap-3xs pad-x-xs pad-top-2xs raised tabbar-top">
	<!-- Home tab -->
	<button class="tab tab-home is-icon text-secondary" class:tab-active={$activeTabId === HOME_TAB_ID}
		onclick={() => tabStore.goHome()} aria-label="Home" title="Home">
		<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
			<path d="M2 6.5L7 2l5 4.5V12H9V9H5v3H2V6.5z"/>
		</svg>
	</button>

	<!-- File tabs -->
	<div class="tabbar-files row ybot gap-3xs grow min0" role="tablist" aria-label="Open documents">
		{#each $tabs as tab, idx (tab.id)}
			<div class="tab"
				class:tab-active={$activeTabId === tab.id}
				class:drag-over={overIndex === idx && dragIndex !== idx && dragIndex >= 0}
				onmousedown={(e) => handleMouseDown(e, idx)}
				onauxclick={(e) => handleAuxClick(e, tab.id)}
				onclick={() => tabStore.switchTab(tab.id)}
				onkeydown={(e) => handleTabKeydown(e, tab.id)}
				oncontextmenu={(e) => handleContextMenu(e, tab)}
				role="tab"
				aria-selected={$activeTabId === tab.id}
				tabindex="0">
				<span class="tab-label row ycenter gap-2xs truncate">
					{#if tab.dirty}<span class="tab-dirty text-theme weight-700" title="Unsaved changes">•</span>{/if}
					<span class="truncate">{tab.fileName}</span>
				</span>
				<span class="tab-close is-icon text-muted" role="button" tabindex="0"
					aria-label={`Close ${tab.fileName}`}
					onclick={(e) => handleClose(e, tab.id)}
					onkeydown={(e) => handleCloseKeydown(e, tab.id)}>
					<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><line x1="1.5" y1="1.5" x2="7.5" y2="7.5"/><line x1="7.5" y1="1.5" x2="1.5" y2="7.5"/></svg>
				</span>
			</div>
		{/each}
	</div>

	<!-- New tab button -->
	<button class="new-tab-btn is-icon text-muted" onclick={handleNewTab} title="New tab" aria-label="New tab">
		<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
			<line x1="6" y1="2" x2="6" y2="10"/>
			<line x1="2" y1="6" x2="10" y2="6"/>
		</svg>
	</button>
</div>

{#if contextMenuTab}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="scrim fixed inset-0 scrim-raised" onclick={closeContextMenu} onkeydown={() => {}}></div>
	<div class="dropdown popover-shadow fixed bg border  pad-3xs" style="--dropdown-x: {contextMenuPos.x}px; --dropdown-y: {contextMenuPos.y}px;">
		<button onclick={handleCopyPath} class="dropdown-item row ycenter gap-2xs wfull text-sm text-left">
			<span class="truncate">{copyFeedback || "Copy Path"}</span>
		</button>
	</div>
{/if}
