<script lang="ts">
	import { onMount } from 'svelte';
	import { Icon } from 'fractalicons';
	import { luChevronDown, luCheck } from 'fractalicons/lucide';

	export interface MenuItem {
		label: string;
		onSelect?: () => void;
		danger?: boolean;
		disabled?: boolean;
		/** The item that is currently in effect, for a menu that picks a value. */
		active?: boolean;
		shortcut?: string;
		leading?: import('svelte').Snippet;
		/** If true, selecting this item does not close the dropdown (useful for multi-select). */
		keepOpen?: boolean;
		/** For checkable / multi-select menu items. */
		checked?: boolean;
	}

	interface Props {
		items: MenuItem[];
		/** Trigger label. */
		label?: string;
		/** Custom trigger (overrides label). Receives wiring props — aria state, click, Escape — to spread on your element. */
		trigger?: import('svelte').Snippet<[Record<string, unknown>]>;
		align?: 'start' | 'end';
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Optional extra content rendered below the items. */
		children?: import('svelte').Snippet;
		class?: string;
	}

	let {
		items,
		label,
		trigger,
		align = 'start',
		open = $bindable(false),
		onOpenChange,
		children,
		class: className = ''
	}: Props = $props();

	let wrap: HTMLSpanElement | undefined = $state();
	let triggerBtn: HTMLButtonElement | undefined = $state();
	let itemRefs: (HTMLButtonElement | undefined)[] = $state([]);
	let active = $state(-1);

	// Wiring handed to a custom trigger snippet so any element can open the menu.
	const triggerProps = $derived({
		'aria-haspopup': 'menu' as const,
		'aria-expanded': open,
		'data-menu-trigger': 'true',
		onclick: () => setOpen(!open),
		onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false, true)
	});

	function focusTrigger() {
		if (triggerBtn) {
			triggerBtn.focus();
			return;
		}
		wrap?.querySelector<HTMLElement>('[data-menu-trigger]')?.focus();
	}

	function setOpen(value: boolean, restoreFocus = false) {
		if (open === value) return;
		open = value;
		onOpenChange?.(value);
		if (value) {
			active = 0;
			queueMicrotask(() => itemRefs.find((el) => el && !el.disabled)?.focus());
		} else {
			active = -1;
			if (restoreFocus) {
				focusTrigger();
			}
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		const enabled = itemRefs.filter((el) => el && !el.disabled);
		if (enabled.length === 0) return;
		let idx = enabled.findIndex((el) => el === itemRefs[active]);
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			idx = (idx + 1) % enabled.length;
			active = itemRefs.indexOf(enabled[idx]);
			enabled[idx]?.focus();
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			idx = (idx - 1 + enabled.length) % enabled.length;
			active = itemRefs.indexOf(enabled[idx]);
			enabled[idx]?.focus();
		} else if (e.key === 'Home') {
			e.preventDefault();
			active = itemRefs.indexOf(enabled[0]);
			enabled[0]?.focus();
		} else if (e.key === 'End') {
			e.preventDefault();
			active = itemRefs.indexOf(enabled[enabled.length - 1]);
			enabled[enabled.length - 1]?.focus();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			setOpen(false, true);
		}
	}

	onMount(() => {
		function onDocClick(e: MouseEvent) {
			if (open && !wrap?.contains(e.target as Node)) {
				setOpen(false, false);
			}
		}
		document.addEventListener('click', onDocClick);
		return () => document.removeEventListener('click', onDocClick);
	});
</script>

<!--
  Built from the contract's own popover vocabulary — `.relative` to anchor,
  `.popover`/`.open` for the surface, `.navtree-link` for the rows — rather than
  a private `.menu` family. Those classes were defined nowhere, so this rendered
  as unstyled structure and failed the class gate.
-->
<span class="relative {className}" bind:this={wrap}>
	{#if trigger}
		{@render trigger(triggerProps)}
	{:else}
		<button
			bind:this={triggerBtn}
			class="button"
			data-variant="secondary"
			data-state={open ? 'open' : undefined}
			aria-haspopup="menu"
			aria-expanded={open}
			onclick={() => setOpen(!open)}
			onkeydown={(e) => e.key === 'Escape' && setOpen(false, true)}
		>
			{#if label}{label}{:else}Menu{/if}
			<Icon icon={luChevronDown} size={14} />
		</button>
	{/if}

	<!--
	  No `hidden` attribute: `.popover` already hides itself with `visibility`,
	  which keeps its open/close transition and still takes the items out of the
	  tab order. `display: none` from `hidden` would defeat both.
	-->
	<div
		class="popover pad-3xs"
		class:open
		role="menu"
		data-align={align}
		tabindex="-1"
		onkeydown={onKeydown}
	>
		<div class="popover-list box gap-3xs">
			{#each items as item, i (item.label + i)}
				<button
					bind:this={itemRefs[i]}
					class="navtree-link gap-2xs wfull ta-l"
					class:active={item.active}
					class:text-danger={item.danger}
					role="menuitem"
					disabled={item.disabled}
					tabindex={active === i ? 0 : -1}
					onclick={() => {
						item.onSelect?.();
						if (!item.keepOpen) {
							setOpen(false, true);
						}
					}}
					onmouseenter={() => {
						active = i;
					}}
				>
					{#if item.checked !== undefined}
						<span class="row ycenter xcenter text-xs shrink-0" style="width: 14px; height: 14px;">
							{#if item.checked}
								<Icon icon={luCheck} size={12} />
							{/if}
						</span>
					{:else if item.leading}
						{@render item.leading?.()}
					{/if}
					<span class="grow truncate">{item.label}</span>
					{#if item.shortcut}<span class="text-muted text-2xs shrink-0">{item.shortcut}</span>{/if}
				</button>
			{/each}
		</div>
		{#if children}
			<div class="border-top pad-top-3xs">
				{@render children()}
			</div>
		{/if}
	</div>
</span>
