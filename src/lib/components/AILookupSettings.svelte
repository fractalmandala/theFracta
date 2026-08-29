<script lang="ts">
  import { Icon } from "fractalicons";
  import { luPencil, luTrash2, luRotateCcw, luChevronDown, luChevronRight } from "fractalicons/lucide";
  import {
    aiLookup,
    addProvider,
    removeProvider,
    updateProvider,
    addPrompt,
    removePrompt,
    updatePrompt,
    setDefaultProvider,
    resetToDefaults,
    validateProviderUrl,
    type Provider,
    type Prompt,
  } from "$lib/stores/aiLookup";

  // Bundled favicons for the 5 default providers. Sourced once from
  // DuckDuckGo's favicon service (icons.duckduckgo.com/ip3/...) to avoid
  // bot-detection blocks when fetching directly from Cloudflare-fronted
  // providers (Claude, Perplexity, ChatGPT all return challenge pages or
  // 403s on direct curl). Vite imports give us content-hashed URLs and
  // proper MIME types per extension; no runtime network calls.
  import chatgptIcon from "$lib/assets/favicons/chatgpt.webp";
  import claudeIcon from "$lib/assets/favicons/claude.png";
  import perplexityIcon from "$lib/assets/favicons/perplexity.png";
  import googleIcon from "$lib/assets/favicons/google.ico";
  import wikipediaIcon from "$lib/assets/favicons/wikipedia.ico";

  const DEFAULT_FAVICONS: Record<string, string> = {
    "default-chatgpt": chatgptIcon,
    "default-claude": claudeIcon,
    "default-perplexity": perplexityIcon,
    "default-google": googleIcon,
    "default-wikipedia": wikipediaIcon,
  };

  // Only one row can be edited or added at a time. Switching rows cancels.
  let editingProviderId = $state<string | null>(null);
  let addingProviderOpen = $state(false);
  let editingPromptKey = $state<string | null>(null); // `${providerId}:${promptId}`
  let addingPromptFor = $state<string | null>(null);

  // Provider edit / add form fields
  let pName = $state("");
  let pUrl = $state("");
  let pError = $state("");

  // Prompt edit / add form fields
  let prName = $state("");
  let prTemplate = $state("");
  let prError = $state("");

  // Collapse/expand state per provider. Providers with no prompts default
  // collapsed (less visual clutter); user can toggle either way.
  let manuallyToggled = $state<Set<string>>(new Set());
  let collapsed = $state<Set<string>>(new Set());

  // Track favicons that failed to load so we can swap to a letter fallback.
  let faviconErrored = $state<Set<string>>(new Set());

  function isExpanded(p: Provider): boolean {
    if (manuallyToggled.has(p.id)) return !collapsed.has(p.id);
    // Default: expanded if it has prompts, collapsed if empty
    return p.prompts.length > 0;
  }

  function toggleProvider(p: Provider) {
    manuallyToggled.add(p.id);
    if (collapsed.has(p.id)) collapsed.delete(p.id);
    else collapsed.add(p.id);
    // Force reactive update on the Set
    manuallyToggled = new Set(manuallyToggled);
    collapsed = new Set(collapsed);
  }

  function startEditProvider(p: Provider) {
    cancelAll();
    editingProviderId = p.id;
    pName = p.name;
    pUrl = p.urlTemplate;
    // Auto-expand when editing
    if (collapsed.has(p.id)) {
      collapsed.delete(p.id);
      manuallyToggled.add(p.id);
      collapsed = new Set(collapsed);
      manuallyToggled = new Set(manuallyToggled);
    }
  }

  function startAddProvider() {
    cancelAll();
    addingProviderOpen = true;
    pName = "";
    pUrl = "https://?q={prompt}";
  }

  function startEditPrompt(providerId: string, pr: Prompt) {
    cancelAll();
    editingPromptKey = `${providerId}:${pr.id}`;
    prName = pr.name;
    prTemplate = pr.template;
  }

  function startAddPrompt(providerId: string) {
    cancelAll();
    addingPromptFor = providerId;
    prName = "";
    prTemplate = "{selection}";
  }

  function cancelAll() {
    editingProviderId = null;
    addingProviderOpen = false;
    editingPromptKey = null;
    addingPromptFor = null;
    pError = "";
    prError = "";
  }

  function saveProviderForm(targetId: string | null) {
    if (!pName.trim()) {
      pError = "Name is required";
      return;
    }
    const urlError = validateProviderUrl(pUrl);
    if (urlError) {
      pError = urlError;
      return;
    }
    if (targetId) {
      updateProvider(targetId, { name: pName.trim(), urlTemplate: pUrl.trim() });
    } else {
      addProvider(pName.trim(), pUrl.trim());
    }
    cancelAll();
  }

  function savePromptForm(providerId: string, promptId: string | null) {
    if (!prName.trim()) {
      prError = "Name is required";
      return;
    }
    if (!prTemplate.trim()) {
      prError = "Template is required";
      return;
    }
    if (promptId) {
      updatePrompt(providerId, promptId, {
        name: prName.trim(),
        template: prTemplate.trim(),
      });
    } else {
      addPrompt(providerId, prName.trim(), prTemplate.trim());
    }
    cancelAll();
  }

  function handleRemoveProvider(p: Provider) {
    const msg =
      p.prompts.length > 0
        ? `Delete "${p.name}" and its ${p.prompts.length} prompt${p.prompts.length === 1 ? "" : "s"}?`
        : `Delete "${p.name}"?`;
    if (confirm(msg)) removeProvider(p.id);
  }

  function handleRemovePrompt(providerId: string, pr: Prompt) {
    if (confirm(`Delete prompt "${pr.name}"?`)) removePrompt(providerId, pr.id);
  }

  function handleResetDefaults() {
    if (confirm("Reset all providers and prompts to defaults? Your customizations will be lost.")) {
      resetToDefaults();
      cancelAll();
      manuallyToggled = new Set();
      collapsed = new Set();
      faviconErrored = new Set();
    }
  }

  // Resolve the favicon for a provider:
  // 1. The 5 default providers ship bundled icons (no runtime fetch).
  // 2. Custom providers attempt `${origin}/favicon.ico` directly. The webview
  //    sends a normal browser referrer so most sites serve the icon (the
  //    `referrerpolicy="no-referrer"` attribute is intentionally absent —
  //    omitting it tripped Cloudflare bot-detection on big providers).
  // 3. If neither works, the letter-circle fallback renders.
  function faviconUrl(p: Provider): string {
    if (DEFAULT_FAVICONS[p.id]) return DEFAULT_FAVICONS[p.id];
    try {
      const url = new URL(p.urlTemplate.replace("{prompt}", "x"));
      return `${url.origin}/favicon.ico`;
    } catch {
      return "";
    }
  }

  function onFaviconError(providerId: string) {
    faviconErrored.add(providerId);
    faviconErrored = new Set(faviconErrored);
  }
</script>
<div class="ail-root box gap-3xs">
  {#each $aiLookup.providers as p (p.id)}
    {@const expanded = isExpanded(p)}
    {@const isEditingProvider = editingProviderId === p.id}
    <div class="provider border " class:opacity-half={!expanded}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="provider-row row ycenter gap-xs pad-x-xs pad-y-2xs cursor-pointer" onclick={() => toggleProvider(p)}>
        <span class="text-muted shrink-0 icon-chevron-slot" aria-hidden="true">
          {#if expanded}<Icon icon={luChevronDown} size={12} decorative />{:else}<Icon icon={luChevronRight} size={12} decorative />{/if}
        </span>
        <span class="provider-favicon  overflow-hidden">
          {#if faviconErrored.has(p.id) || !faviconUrl(p)}
            <span class="text-xs weight-600 text-secondary">{p.name.charAt(0).toUpperCase()}</span>
          {:else}
            <img class="provider-favicon-img" src={faviconUrl(p)} alt="" onerror={() => onFaviconError(p.id)} />
          {/if}
        </span>
        <span class="text-sm weight-500 grow min0 truncate">{p.name}</span>
        {#if p.prompts.length > 0}
          <span class="text-xs text-muted tabular-nums pad-x-2xs pad-y-3xs  surface">{p.prompts.length}</span>
        {/if}
        <div class="provider-actions row gap-3xs shrink-0">
          <button class="button is-icon text-muted" title="Edit provider" aria-label="Edit provider" onclick={(e) => { e.stopPropagation(); startEditProvider(p); }}>
            <Icon icon={luPencil} size={14} decorative />
          </button>
          <button class="button is-icon text-muted" title="Delete provider" aria-label="Delete provider" onclick={(e) => { e.stopPropagation(); handleRemoveProvider(p); }}>
            <Icon icon={luTrash2} size={14} decorative />
          </button>
        </div>
      </div>

      {#if expanded}
        {#if isEditingProvider}
          <div class="edit-form box gap-2xs pad-xs surface border-top">
            <input class="input text-xs wfull" bind:value={pName} placeholder="Provider name" />
            <input class="input text-xs mono wfull" bind:value={pUrl} placeholder="https://example.com/?q={prompt}" />
            {#if pError}<div class="text-xs text-danger">{pError}</div>{/if}
            <div class="row ycenter xbetween gap-3xs">
              <span aria-hidden="true" class="grow"></span>
              <button class="button ghost text-xs" onclick={cancelAll}>Cancel</button>
              <button class="button primary text-xs" onclick={() => saveProviderForm(p.id)}>Save</button>
            </div>
          </div>
        {/if}

        <div class="prompts box gap-3xs pad-x-sm pad-bottom-xs pad-left-lg">
          {#each p.prompts as pr (pr.id)}
            {@const isEditingThisPrompt = editingPromptKey === `${p.id}:${pr.id}`}
            {#if isEditingThisPrompt}
              <div class="edit-form box gap-2xs pad-xs surface border-top border  m-y-3xs">
                <input class="input text-xs wfull" bind:value={prName} placeholder="Prompt name" />
                <textarea class="input text-xs mono wfull" bind:value={prTemplate} rows="2" placeholder={'Template — use {selection} where the text goes'}></textarea>
                {#if prError}<div class="text-xs text-danger">{prError}</div>{/if}
                <div class="row ycenter xbetween gap-3xs">
                  <span aria-hidden="true" class="grow"></span>
                  <button class="button ghost text-xs" onclick={cancelAll}>Cancel</button>
                  <button class="button primary text-xs" onclick={() => savePromptForm(p.id, pr.id)}>Save</button>
                </div>
              </div>
            {:else}
              <div class="prompt-row row ycenter gap-2xs pad-x-2xs pad-y-3xs " title={pr.template}>
                <span class="text-xs grow min0 truncate">{pr.name}</span>
                <div class="prompt-actions row gap-3xs shrink-0">
                  <button class="button is-icon text-muted" title="Edit prompt" aria-label="Edit prompt" onclick={() => startEditPrompt(p.id, pr)}>
                    <Icon icon={luPencil} size={13} decorative />
                  </button>
                  <button class="button is-icon text-muted" title="Delete prompt" aria-label="Delete prompt" onclick={() => handleRemovePrompt(p.id, pr)}>
                    <Icon icon={luTrash2} size={13} decorative />
                  </button>
                </div>
              </div>
            {/if}
          {/each}

          {#if addingPromptFor === p.id}
            <div class="edit-form box gap-2xs pad-xs surface border ">
              <input class="input text-xs wfull" bind:value={prName} placeholder="Prompt name" />
              <textarea class="input text-xs mono wfull" bind:value={prTemplate} rows="2" placeholder={'Template — use {selection} where the text goes'}></textarea>
              {#if prError}<div class="text-xs text-danger">{prError}</div>{/if}
              <div class="row ycenter xbetween gap-3xs">
                <span aria-hidden="true" class="grow"></span>
                <button class="button ghost text-xs" onclick={cancelAll}>Cancel</button>
                <button class="button primary text-xs" onclick={() => savePromptForm(p.id, null)}>Add</button>
              </div>
            </div>
          {:else}
            <button class="button ghost dashed-action text-xs text-muted align-self-start m-top-3xs" onclick={() => startAddPrompt(p.id)}>+ Add prompt</button>
          {/if}
        </div>
      {/if}
    </div>
  {/each}

  {#if addingProviderOpen}
    <div class="edit-form box gap-2xs pad-xs surface border  m-top-2xs">
      <input class="input text-xs wfull" bind:value={pName} placeholder="Provider name" />
      <input class="input text-xs mono wfull" bind:value={pUrl} placeholder="https://example.com/?q={prompt}" />
      {#if pError}<div class="text-xs text-danger">{pError}</div>{/if}
      <div class="row ycenter xbetween gap-3xs">
        <span aria-hidden="true" class="grow"></span>
        <button class="button ghost text-xs" onclick={cancelAll}>Cancel</button>
        <button class="button primary text-xs" onclick={() => saveProviderForm(null)}>Add</button>
      </div>
    </div>
  {:else}
    <button class="button ghost dashed-action text-xs text-muted wfull m-top-2xs" onclick={startAddProvider}>+ Add provider</button>
  {/if}

  <div class="default-row row ycenter xbetween gap-xs pad-top-xs pad-bottom-3xs border-top m-top-2xs">
    <span class="text-xs text-secondary">Default for Custom prompt</span>
    <div class="row ycenter gap-2xs">
      {#if $aiLookup.providers.length > 0}
        <select class="select text-xs" value={$aiLookup.defaultProviderId}
          onchange={(e) => setDefaultProvider(e.currentTarget.value)}>
          {#each $aiLookup.providers as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      {/if}
      <button class="button is-icon text-muted" title="Reset to defaults" aria-label="Reset all providers and prompts to defaults" onclick={handleResetDefaults}>
        <Icon icon={luRotateCcw} size={14} decorative />
      </button>
    </div>
  </div>
</div>
