<script lang="ts">
  let { visible = $bindable(false), src = "", images = [] as string[], index = $bindable(0) }: {
    visible: boolean;
    src: string;
    images: string[];
    index: number;
  } = $props();

  function close() { visible = false; }

  function next() {
    if (images.length > 1) {
      index = (index + 1) % images.length;
    }
  }

  function prev() {
    if (images.length > 1) {
      index = (index - 1 + images.length) % images.length;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }

  function handleLightboxKeydown(e: KeyboardEvent) {
    e.stopPropagation();
    handleKeydown(e);
  }

  $effect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeydown);
      return () => document.removeEventListener("keydown", handleKeydown);
    }
  });

  let currentSrc = $derived(images.length > 0 ? images[index] : src);
</script>
{#if visible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="lightbox fixed inset-0 box ycenter xcenter pad-md z-modal" role="dialog" aria-modal="true" aria-label="Image preview" tabindex="-1" onclick={handleBackdrop} onkeydown={handleLightboxKeydown}>
    <button class="lb-close absolute is-icon text-inverse cursor-pointer" aria-label="Close image preview" onclick={close}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
    </button>

    {#if images.length > 1}
      <button class="lb-nav absolute is-icon text-inverse cursor-pointer" aria-label="Previous image" onclick={prev}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="13,4 7,10 13,16"/></svg>
      </button>
      <button class="lb-nav lb-next absolute is-icon text-inverse cursor-pointer" aria-label="Next image" onclick={next}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="7,4 13,10 7,16"/></svg>
      </button>
      <div class="lb-counter absolute text-sm text-inverse-muted tabular-nums">{index + 1} / {images.length}</div>
    {/if}

    <img class="lb-image" src={currentSrc} alt="" />
  </div>
{/if}
