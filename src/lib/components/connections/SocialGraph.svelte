<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { Connection } from '$lib/crypto/connections';

	interface Props {
		connections: Connection[];
		onselect: (connection: Connection) => void;
	}

	let { connections, onselect }: Props = $props();

	let containerRef: HTMLDivElement | undefined = $state();
	let width = $state(0);
	let height = $state(400);

	interface GraphNode {
		id: string;
		connection: Connection;
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
		targetDist: number;
		recency: number;
	}

	let nodes = $state<GraphNode[]>([]);
	let hoveredNode = $state<string | null>(null);

	// Pan + zoom state
	let panX = $state(0);
	let panY = $state(0);
	let scale = $state(1);

	// Single-finger pan tracking
	let isPanning = false;
	let lastPointerX = 0;
	let lastPointerY = 0;

	// Multi-touch tracking for pinch-to-zoom
	let activePointers = new Map<number, { x: number; y: number }>();
	let lastPinchDist = 0;
	let lastPinchCenterX = 0;
	let lastPinchCenterY = 0;
	let isPinching = false;

	// Node tap tracking
	let nodePointerStartX = 0;
	let nodePointerStartY = 0;

	const CENTER_RADIUS = 20;
	const SIX_MONTHS = 180 * 86400;
	const MIN_SCALE = 0.5;
	const MAX_SCALE = 3;

	function getRecency(lastShared: number): number {
		const now = Date.now() / 1000;
		return Math.max(0, Math.min(1, 1 - (now - lastShared) / SIX_MONTHS));
	}

	function getRadius(sharedEvents: number): number {
		return Math.min(40, Math.max(22, 14 + sharedEvents * 4));
	}

	let maxSharedEvents = $derived(Math.max(...connections.map((c) => c.shared_events), 1));

	function getEdgeThickness(sharedEvents: number): number {
		const normalized = maxSharedEvents > 0 ? sharedEvents / maxSharedEvents : 0;
		return 1 + normalized * 3.5;
	}

	function getEdgeOpacity(recency: number): number {
		return 0.12 + recency * 0.48;
	}

	// Re-derive nodes when connections or dimensions change
	$effect(() => {
		const cx = width / 2;
		const cy = height / 2;
		const count = connections.length;
		const minDist = 65;
		const maxDist = Math.min(width, height) * 0.42;

		// Normalize distances to ACTUAL date range, not the full 6-month window.
		// Without this, connections within a few weeks of each other all map to
		// nearly the same radius (e.g., 0.98 vs 0.99 recency = 1px difference).
		const timestamps = connections.map((c) => c.last_shared);
		const minTs = Math.min(...timestamps);
		const maxTs = Math.max(...timestamps);
		const tsRange = maxTs - minTs;

		nodes = connections.map((c, i) => {
			const recency = getRecency(c.last_shared);

			// Relative recency: 0 = oldest connection, 1 = most recent
			// This spreads nodes across the full distance range regardless
			// of how close together the actual dates are.
			let relativeRecency: number;
			if (tsRange < 86400 || count === 1) {
				// All same day or single node — put in middle
				relativeRecency = 0.5;
			} else {
				relativeRecency = (c.last_shared - minTs) / tsRange;
			}

			const targetDist = minDist + (1 - relativeRecency) * (maxDist - minDist);
			const angle = (2 * Math.PI * i) / count - Math.PI / 2;
			return {
				id: c.user_id,
				connection: c,
				x: cx + Math.cos(angle) * targetDist + (Math.random() - 0.5) * 20,
				y: cy + Math.sin(angle) * targetDist + (Math.random() - 0.5) * 20,
				vx: 0,
				vy: 0,
				radius: getRadius(c.shared_events),
				targetDist,
				recency
			};
		});
		panX = 0;
		panY = 0;
		scale = 1;
		untrack(() => startSimulation());
	});

	onMount(() => {
		if (!containerRef) return;

		width = containerRef.clientWidth;
		height = Math.max(300, Math.min(500, width * 0.8));

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				width = entry.contentRect.width;
				height = Math.max(300, Math.min(500, entry.contentRect.width * 0.8));
			}
		});
		observer.observe(containerRef);

		return () => {
			observer.disconnect();
			stopSimulation();
		};
	});

	let animFrame: number | null = null;

	function startSimulation() {
		stopSimulation();
		if (nodes.length === 0 || !width) return;

		const centerX = width / 2;
		const centerY = height / 2;
		let frameCount = 0;
		let settled = false;

		function tick() {
			// Repulsion between nodes — pushes overlapping nodes apart
			for (let i = 0; i < nodes.length; i++) {
				for (let j = i + 1; j < nodes.length; j++) {
					const a = nodes[i];
					const b = nodes[j];
					const dx = b.x - a.x;
					const dy = b.y - a.y;
					const dist = Math.sqrt(dx * dx + dy * dy) || 1;
					const minDist = a.radius + b.radius + 12;

					if (dist < minDist) {
						const force = ((minDist - dist) / dist) * 0.3;
						const fx = dx * force;
						const fy = dy * force;
						a.vx -= fx;
						a.vy -= fy;
						b.vx += fx;
						b.vy += fy;
					}
				}
			}

			// Apply velocities with damping, then enforce radial constraint
			let maxSpeed = 0;
			for (const node of nodes) {
				node.vx *= 0.6;
				node.vy *= 0.6;
				node.x += node.vx;
				node.y += node.vy;

				// Hard constraint: project node back onto its target radius
				const dx = node.x - centerX;
				const dy = node.y - centerY;
				const dist = Math.sqrt(dx * dx + dy * dy) || 1;
				node.x = centerX + (dx / dist) * node.targetDist;
				node.y = centerY + (dy / dist) * node.targetDist;

				// Strip radial velocity — only keep tangential movement
				const radialSpeed = (node.vx * dx + node.vy * dy) / (dist * dist);
				node.vx -= radialSpeed * dx;
				node.vy -= radialSpeed * dy;

				const speed = node.vx * node.vx + node.vy * node.vy;
				if (speed > maxSpeed) maxSpeed = speed;
			}

			frameCount++;

			if (frameCount % 3 === 0) {
				nodes = [...nodes];
			}

			if (maxSpeed > 0.01 && frameCount < 400) {
				animFrame = requestAnimationFrame(tick);
			} else if (!settled) {
				settled = true;
				nodes = [...nodes];
			}
		}

		animFrame = requestAnimationFrame(tick);
	}

	function stopSimulation() {
		if (animFrame !== null) {
			cancelAnimationFrame(animFrame);
			animFrame = null;
		}
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}

	// --- Pinch distance helper ---

	function getPinchDist(): number {
		const pts = [...activePointers.values()];
		if (pts.length < 2) return 0;
		const dx = pts[1].x - pts[0].x;
		const dy = pts[1].y - pts[0].y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getPinchCenter(): { x: number; y: number } {
		const pts = [...activePointers.values()];
		if (pts.length < 2) return { x: 0, y: 0 };
		return {
			x: (pts[0].x + pts[1].x) / 2,
			y: (pts[0].y + pts[1].y) / 2
		};
	}

	// --- Unified pointer handlers on SVG ---

	function handlePointerDown(e: PointerEvent) {
		// Skip if originated on a node (nodes handle their own events)
		if ((e.target as Element).closest('[data-node]')) return;

		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 1) {
			// Single finger — start pan
			isPanning = true;
			isPinching = false;
			lastPointerX = e.clientX;
			lastPointerY = e.clientY;
		} else if (activePointers.size === 2) {
			// Second finger — switch to pinch mode
			isPanning = false;
			isPinching = true;
			lastPinchDist = getPinchDist();
			const center = getPinchCenter();
			lastPinchCenterX = center.x;
			lastPinchCenterY = center.y;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!activePointers.has(e.pointerId)) return;
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (isPinching && activePointers.size >= 2) {
			// Pinch-to-zoom
			const newDist = getPinchDist();
			if (lastPinchDist > 0 && newDist > 0) {
				const zoomDelta = newDist / lastPinchDist;
				const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * zoomDelta));

				// Zoom toward the pinch center
				const center = getPinchCenter();
				const rect = containerRef?.getBoundingClientRect();
				if (rect) {
					const svgX = center.x - rect.left;
					const svgY = center.y - rect.top;
					// Adjust pan so the point under the pinch center stays fixed
					const scaleFactor = newScale / scale;
					panX = svgX - scaleFactor * (svgX - panX);
					panY = svgY - scaleFactor * (svgY - panY);
				}

				scale = newScale;

				// Also handle two-finger pan (move the pinch center)
				const dx = center.x - lastPinchCenterX;
				const dy = center.y - lastPinchCenterY;
				panX += dx;
				panY += dy;
				lastPinchCenterX = center.x;
				lastPinchCenterY = center.y;
			}
			lastPinchDist = newDist;
		} else if (isPanning && activePointers.size === 1) {
			// Single-finger pan
			const dx = e.clientX - lastPointerX;
			const dy = e.clientY - lastPointerY;
			panX += dx;
			panY += dy;
			lastPointerX = e.clientX;
			lastPointerY = e.clientY;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		activePointers.delete(e.pointerId);

		if (activePointers.size === 0) {
			isPanning = false;
			isPinching = false;
		} else if (activePointers.size === 1) {
			// Went from 2 fingers to 1 — switch back to pan
			isPinching = false;
			isPanning = true;
			const remaining = [...activePointers.values()][0];
			lastPointerX = remaining.x;
			lastPointerY = remaining.y;
		}
	}

	// --- Node tap handlers (separate from pan/zoom) ---

	function handleNodePointerDown(e: PointerEvent) {
		e.stopPropagation();
		nodePointerStartX = e.clientX;
		nodePointerStartY = e.clientY;
	}

	function handleNodePointerUp(e: PointerEvent, connection: Connection) {
		const dx = e.clientX - nodePointerStartX;
		const dy = e.clientY - nodePointerStartY;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 10) {
			onselect(connection);
		}
	}
</script>

<div bind:this={containerRef} class="w-full overflow-hidden rounded-xl" style="background: var(--surface-card)">
	{#if nodes.length === 0}
		<div class="flex items-center justify-center py-16">
			<p class="text-body-sm text-[var(--text-muted)]">No connections to display</p>
		</div>
	{:else if width === 0}
		<div class="flex items-center justify-center" style="height: 300px">
			<p class="text-body-sm text-[var(--text-muted)]">Loading graph...</p>
		</div>
	{:else}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<svg
			{width}
			{height}
			viewBox="0 0 {width} {height}"
			role="img"
			aria-label="Social connection graph"
			style="touch-action: none"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
		>
			<!-- Pannable + zoomable content group -->
			<g transform="translate({panX}, {panY}) scale({scale})">
				<!-- Connection edges from center to nodes -->
				{#each nodes as node (node.id)}
					<line
						x1={width / 2}
						y1={height / 2}
						x2={node.x}
						y2={node.y}
						stroke="var(--accent-primary)"
						stroke-width={getEdgeThickness(node.connection.shared_events)}
						opacity={getEdgeOpacity(node.recency)}
						stroke-linecap="round"
					/>
				{/each}

				<!-- Center "You" node (behind other nodes in z-order) -->
				<g transform="translate({width / 2}, {height / 2})">
					<circle
						r={CENTER_RADIUS}
						fill="var(--surface-overlay)"
						stroke="var(--border-default)"
						stroke-width="1.5"
					/>
					<text
						text-anchor="middle"
						dominant-baseline="central"
						fill="var(--text-secondary)"
						font-size="11"
						font-weight="600"
						font-family="var(--font-body)"
					>
						You
					</text>
				</g>

				<!-- Connection nodes -->
				{#each nodes as node (node.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<g
						data-node
						class="cursor-pointer"
						transform="translate({node.x}, {node.y})"
						onpointerdown={handleNodePointerDown}
						onpointerup={(e) => handleNodePointerUp(e, node.connection)}
						onpointerenter={() => (hoveredNode = node.id)}
						onpointerleave={() => (hoveredNode = null)}
						role="button"
						tabindex={0}
					>
						<!-- Invisible larger hit area for touch (min 44px) -->
						<circle r={Math.max(22, node.radius)} fill="transparent" />
						<!-- Visible circle -->
						<circle
							r={node.radius}
							fill={hoveredNode === node.id
								? 'var(--accent-hover)'
								: 'var(--accent-primary)'}
							opacity={hoveredNode === node.id ? 1 : 0.55 + node.recency * 0.45}
							style="transition: fill 150ms ease, opacity 150ms ease"
						/>
						<!-- Initials -->
						<text
							text-anchor="middle"
							dominant-baseline="central"
							fill="var(--surface-base)"
							font-size={node.radius * 0.65}
							font-weight="600"
							font-family="var(--font-body)"
							style="pointer-events: none"
						>
							{getInitials(node.connection.display_name)}
						</text>
						<!-- Name label below node -->
						<text
							text-anchor="middle"
							y={node.radius + 14}
							fill="var(--text-muted)"
							font-size="10"
							font-family="var(--font-body)"
							style="pointer-events: none"
						>
							{node.connection.display_name.split(' ')[0]}
						</text>
					</g>
				{/each}
			</g>
		</svg>
	{/if}
</div>
