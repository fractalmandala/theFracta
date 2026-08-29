// Graph View, Flows, and Node Inspector State Module
export interface FlowDef {
	id: string;
	name: string;
	trigger: string;
	steps: string[];
	summary?: string;
}

export interface NoteDef {
	title: string;
	body: string;
	severity: 'alert' | 'warn' | 'info';
	path?: string;
}

class GraphState {
	selectedNode = $state<any | null>(null);
	activeFlowId = $state<string | null>(null);
	activeFlowStepIndex = $state<number>(0);
	collapsed = $state<Set<string>>(new Set());
	activeLayers = $state<Set<string>>(new Set());
	minWeight = $state<number>(1);
	searchQuery = $state<string>('');
	isNotesOpen = $state<boolean>(false);

	toggleCollapse(id: string) {
		const next = new Set(this.collapsed);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		this.collapsed = next;
	}

	expandAll() {
		this.collapsed = new Set();
	}

	collapseAll(roots: string[]) {
		this.collapsed = new Set(roots);
	}

	toggleLayer(layer: string) {
		const next = new Set(this.activeLayers);
		if (next.has(layer)) next.delete(layer);
		else next.add(layer);
		this.activeLayers = next;
	}

	setAllLayers(layers: string[]) {
		this.activeLayers = new Set(layers);
	}

	pickFlow(flow: FlowDef | null) {
		this.activeFlowId = flow ? flow.id : null;
		this.activeFlowStepIndex = 0;
	}

	nextFlowStep(totalSteps: number) {
		if (this.activeFlowStepIndex < totalSteps - 1) {
			this.activeFlowStepIndex++;
		}
	}

	prevFlowStep() {
		if (this.activeFlowStepIndex > 0) {
			this.activeFlowStepIndex--;
		}
	}

	selectNode(node: any) {
		this.selectedNode = node;
	}

	clearSelection() {
		this.selectedNode = null;
	}

	toggleNotes() {
		this.isNotesOpen = !this.isNotesOpen;
	}
}

export const graphState = new GraphState();
