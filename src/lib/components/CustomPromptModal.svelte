<script lang="ts">
  import { tick } from "svelte";
  import { aiLookup, assembleUrl, type Provider } from "$lib/stores/aiLookup";

  let {
    visible = $bindable(false),
    selection = "",
  }: { visible: boolean; selection?: string } = $props();

  let promptText = $state("");
  let providerId = $state("");
  let error = $state("");
  let sending = $state(false);
  let promptEl: HTMLTextAreaElement | undefined = $state();

  const providers = $derived($aiLookup.providers);
  const defaultProviderId = $derived($aiLookup.defaultProviderId);
  const selectedProvider = $derived<Provider | undefined>(
    providers.find((p) => p.id === providerId),
  );
  const hasSelection = $derived(selection.trim().length > 0);
  const canSend = $derived(
    !!selectedProvider && promptText.trim().length > 0 && !sending,
  );

  // When the modal opens, reset transient state and focus the textarea. We
  // intentionally keep `promptText` blank each time — saved templates exist for
  // the "remember this wrapper" case; this modal is for ad-hoc prompts.
  $effect(() => {
    if (visible) {
      promptText = "";
      providerId = defaultProviderId || providers[0]?.id || "";
      error = "";
      sending = false;
      tick().then(() => promptEl?.focus());
    }
  });

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) visible = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      visible = false;
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSend() {
    if (!canSend || !selectedProvider) return;
    sending = true;
    error = "";

    // Compose final prompt: user's wrapper + selection if present.
    // The provider's URL template has `{prompt}` (validated on save); the
    // composed string gets URL-encoded into that slot by assembleUrl.
    const composed = hasSelection ? `${promptText}\n\n${selection}` : promptText;

    try {
      // Reuse the provider's URL template with a synthetic prompt template
      // that's just the composed string. assembleUrl substitutes {selection}
      // first (no-op here, since composed has no token) then URL-encodes
      // into {prompt}.
      const url = assembleUrl(selectedProvider.urlTemplate, composed, "");
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      visible = false;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to open URL";
      sending = false;
    }
  }
</script>
{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="dialog-backdrop fixed inset-0 box ycenter xcenter pad-top-2xl" onclick={handleBackdropClick} onkeydown={handleKeydown}>
    <div class="dialog-card card bg-dialog border box dialog-h-screen dialog-md">
      <header class="dialog-header row ycenter xbetween pad-x-sm pad-y-xs border-bottom">
        <h2 class="text-md weight-600 m-0">Custom AI Prompt</h2>
        <button onclick={() => (visible = false)} class="button is-icon text-muted" aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/>
          </svg>
        </button>
      </header>

      <div class="dialog-body box gap-sm pad-x-sm pad-y-sm scroll-y">
        {#if hasSelection}
          <div class="field box gap-3xs">
            <div class="field-label text-xs weight-500 text-secondary">Selected text</div>
            <div class="selection-box surface border pad-x-xs pad-y-2xs text-sm text-primary">{selection}</div>
          </div>
        {:else}
          <p class="text-xs text-muted m-0 pad-y-3xs">No selection — your prompt will be sent as-is.</p>
        {/if}

        <div class="field box gap-3xs">
          <label for="custom-prompt-text" class="field-label text-xs weight-500 text-secondary row ycenter gap-2xs">
            Your prompt
            {#if hasSelection}<span class="text-xs text-muted">(the selection above will be appended)</span>{/if}
          </label>
          <textarea id="custom-prompt-text" bind:this={promptEl} bind:value={promptText}
            placeholder={hasSelection ? "Give me a concise background on this company:" : "Type your prompt…"}
            class="prompt-input input text-sm wfull" rows="4"></textarea>
        </div>

        <div class="field row ycenter gap-xs">
          <label for="custom-prompt-provider" class="field-label text-xs weight-500 text-secondary shrink-0">Provider</label>
          {#if providers.length === 0}
            <div class="text-xs text-danger">No providers configured — add one in Settings.</div>
          {:else}
            <select id="custom-prompt-provider" bind:value={providerId} class="select text-sm grow min0">
              {#each providers as p (p.id)}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          {/if}
        </div>

        {#if error}
          <div class="field-error-row text-xs text-danger pad-x-2xs pad-y-3xs">{error}</div>
        {/if}
      </div>

      <footer class="dialog-footer row ycenter xbetween pad-x-sm pad-y-xs border-top gap-2xs">
        <span aria-hidden="true" class="grow"></span>
        <button onclick={() => (visible = false)} class="button ghost text-sm">Cancel</button>
        <button onclick={handleSend} disabled={!canSend} class="button primary text-sm">{sending ? "Opening…" : "Send →"}</button>
      </footer>
    </div>
  </div>
{/if}
