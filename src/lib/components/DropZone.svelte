<script lang="ts">
  import { openFile } from "../tauri/files";
  import { getCurrentWebview } from "@tauri-apps/api/webview";
  import { onMount } from "svelte";

  let isDragging = $state(false);

  onMount(() => {
    let unlisten: (() => void) | undefined;
    const runtime = window as unknown as Record<string, unknown>;
    if (!runtime.__TAURI_INTERNALS__ && !runtime.__TAURI__ && !runtime.__TAURI_IPC__) return;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          if ((window as any).__fracta_tab_dragging) return;
          isDragging = true;
        } else if (event.payload.type === "drop") {
          isDragging = false;
          const files = event.payload.paths;
          if (files.length > 0) {
            const file = files[0];
            if (file.match(/\.(md|markdown|mdown|mkd|txt)$/i)) {
              openFile(file);
            }
          }
        } else if (event.payload.type === "leave") {
          isDragging = false;
        }
      })
      .then((fn) => { unlisten = fn; });

    return () => unlisten?.();
  });
</script>

{#if isDragging}
  <div class="dropzone fixed inset-0 z-modal box ycenter xcenter backdrop-blur pointer-events-none">
    <div class="box ycenter xcenter gap-2xs pad-md pad-x-2xl border-theme">
      <svg width="36" height="36" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="20" height="24" rx="2" />
        <polyline points="12,14 16,10 20,14" />
        <line x1="16" y1="10" x2="16" y2="22" />
      </svg>
      <p class="text-md weight-500 m-0">Drop to open</p>
    </div>
  </div>
{/if}
