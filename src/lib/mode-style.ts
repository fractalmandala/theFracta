export function modeStyle(node: HTMLElement, css: string) {
	if (typeof document === 'undefined') return {};
	const style = document.createElement('style');
	style.textContent = css;
	document.head.append(style);
	return {
		destroy() {
			style.remove();
		}
	};
}
