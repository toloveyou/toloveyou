<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';

	gsap.registerPlugin(ScrollTrigger);

	const words = ['TOM', 'Will', 'You', 'Date Me?'];

	// Svelte 5 States
	let currentStage = $state<'scrolling' | 'assembled' | 'accepted'>('scrolling'); // 'scrolling' | 'assembled' | 'accepted'
	let cancelCount = $state(0);
	let selectedDate = $state('');
	let cancelBtnElement: HTMLButtonElement | undefined = $state();

	const cancelArguments = [
		'Cancel',
		'Wait, really? 🥺',
		'Are you sure? There will be pizza!',
		'Think of the dessert choices!',
		"I'm legally moving this button now.",
		'Okay, rude! 😂',
		'Error 404: Refusal not found.',
		'Give up and go out with me!'
	];

	let cancelText = $derived(cancelArguments[Math.min(cancelCount, cancelArguments.length - 1)]);

	// DOM Elements
	let container: HTMLDivElement;
	let prism: HTMLDivElement;
	let wordElements: HTMLDivElement[] = [];
	let promptForm: HTMLDivElement;
	let confettiContainer: HTMLDivElement;

	onMount(() => {
		const angleStep = 360 / words.length;
		const vhInPixels = window.innerHeight * 0.3;
		// Boost the face width calculation so the 3D engine expects larger text bounds
		const faceWidth = clampPixelCalc();
		const radius = vhInPixels / 2 / Math.tan(Math.PI / words.length); // Adjusted for 4 faces with wider text

		// Initialize 3D placements
		gsap.set(wordElements, {
			rotateX: (i) => -i * angleStep,
			transformOrigin: `50% 50% -${radius}px`,
			top: 0,
			left: 0,
			yPercent: 0
		});
		gsap.set(prism, {
			transformOrigin: `50% 50%`,
			y: 0
		});

		const totalScrollHeight = window.innerHeight * 2.5;
		gsap.set(container, { height: totalScrollHeight + window.innerHeight });

		// Core Scroll Viewport Lock Timeline
		const scrollTl = gsap.timeline({
			scrollTrigger: {
				trigger: container,
				start: 'top top',
				end: 'bottom bottom',
				scrub: 1,
				pin: '.prism-viewport',
				onUpdate: (self) => {
					if (self.progress >= 0.98) {
						if (currentStage !== 'assembled') {
							currentStage = 'assembled';
							gsap.to(promptForm, { opacity: 1, y: 0, duration: 0.4 });
						}
					} else {
						if (currentStage !== 'scrolling') {
							currentStage = 'scrolling';
							gsap.to(promptForm, { opacity: 0, y: 40, duration: 0.3 });
						}
					}
				}
			}
		});

		scrollTl.to(prism, {
			rotateX: angleStep * (words.length - 1),
			ease: 'none'
		});

		// FIX: Increased the scaling width limits so the math works gracefully with huge typography
		function clampPixelCalc() {
			const width = window.innerWidth;
			if (width < 480) return width * 0.9;
			return Math.min(width * 0.5, 550); // Increased from 400 to 550
		}
		// gsap.to(prism, { opacity: 1, duration: 0.5, ease: 'power1.out' });
	});
	function handleCancelHover() {
		if (currentStage !== 'assembled') return;
		cancelCount++;
		if (cancelCount >= cancelArguments.length) return;

		const rangeX = (window.innerWidth - 200) / 3;
		const rangeY = (window.innerHeight - 100) / 3;

		gsap.to(cancelBtnElement!, {
			x: (Math.random() - 0.5) * rangeX,
			y: (Math.random() - 0.5) * rangeY,
			duration: 0.25,
			ease: 'power2.out'
		});
	}

	function handleConfirm(e: Event) {
		e.preventDefault();
		if (!selectedDate) {
			alert('Please pick a preferred option first! 🥰');
			return;
		}

		currentStage = 'accepted';

		const confettiCount = 140;
		const colors = ['#E5989B', '#B58285', '#81B29A', '#F2CC8F', '#F4A261'];

		for (let i = 0; i < confettiCount; i++) {
			const paper = document.createElement('div');
			paper.className = 'confetti-piece';
			gsap.set(paper, {
				backgroundColor: colors[Math.floor(Math.random() * colors.length)],
				x: gsap.utils.random(0, window.innerWidth),
				y: -20,
				rotation: gsap.utils.random(0, 360),
				scale: gsap.utils.random(0.5, 1)
			});
			confettiContainer.appendChild(paper);

			gsap.to(paper, {
				y: window.innerHeight + 50,
				rotationX: gsap.utils.random(360, 1080),
				rotationY: gsap.utils.random(360, 1080),
				x: `+=${gsap.utils.random(-150, 150)}`,
				duration: gsap.utils.random(3, 5.5),
				ease: 'power1.out',
				delay: gsap.utils.random(0, 1.2),
				onComplete: () => paper.remove()
			});
		}
	}
</script>

<div class="scroll-container" bind:this={container}>
	<div class="prism-viewport">
		<div class="sentence-wrapper {currentStage === 'assembled' ? 'collapsed-row' : 'clip-3d'}">
			<div class="prism" bind:this={prism}>
				{#each words as word, i}
					<div class="face display-text" bind:this={wordElements[i]}>
						{word}
					</div>
				{/each}
			</div>
		</div>
		{#if currentStage === 'scrolling'}
			<div class="scroll-hint" transition:fade={{ duration: 200 }}>
				<p>Scroll down</p>
				<span class="arrow">↓</span>
			</div>
		{/if}

		<div class="prompt-form" bind:this={promptForm}>
			{#if currentStage !== 'accepted'}
				<form onsubmit={handleConfirm}>
					<p class="section-title">When?</p>
					<p class="details-body"></p>

					<div class="date-selector">
						<label class="radio-card {selectedDate === 'opt1' ? 'active' : ''}">
							<input type="radio" name="dateOption" value="opt1" bind:group={selectedDate} />
							<span>Sunday at 8:00 PM</span>
						</label>
						<label class="radio-card {selectedDate === 'opt2' ? 'active' : ''}">
							<input type="radio" name="dateOption" value="opt2" bind:group={selectedDate} />
							<span>Saturday at 6:00 PM</span>
						</label>
						<label class="radio-card {selectedDate === 'opt3' ? 'active' : ''}">
							<input type="radio" name="dateOption" value="opt3" bind:group={selectedDate} />
							<span>SOMETHING ELSE (Our choice)</span>
						</label>
					</div>

					<div class="button-deck">
						<button type="submit" class="btn btn-confirm"> Confirm Choice ✨ </button>

						{#if cancelCount < cancelArguments.length}
							<button
								type="button"
								class="btn btn-cancel"
								bind:this={cancelBtnElement}
								onmouseenter={handleCancelHover}
								onclick={handleCancelHover}
							>
								{cancelText}
							</button>
						{:else}
							<button type="submit" class="btn btn-confirm alternative-confirm">
								Yes, Definitely Yes! ❤️
							</button>
						{/if}
					</div>
				</form>
			{:else}
				<div class="success-message">
					<h2>It's a Date! See you then! 🥰🎉</h2>
					<p>Check your schedule, I'll count down the hours!</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<div class="confetti-holder" bind:this={confettiContainer}></div>

<style lang="scss">
	.scroll-container {
		width: 100%;
		position: relative;
	}

	.prism-viewport {
		height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		perspective: 10000px;
		overflow: hidden;
	}

	.sentence-wrapper {
		position: relative;
		width: 100%;
		height: fit-content;
		display: flex;
		justify-content: center;
		align-items: center;
		transform-style: preserve-3d;
		transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);

		// FIX: Drastically enlarged the clipping window and added padding comfort space
		&.clip-3d {
			height: min(50vh, 50vw); // Uses explicit viewport percentage to give massive vertical room
			overflow: hidden;
			padding: 2rem 0;
		}

		&.collapsed-row {
			height: auto;
			overflow: visible;
			flex-wrap: wrap;

			.prism {
				display: flex;
				flex-direction: row;
				justify-content: center;
				gap: 1.5rem;
				width: 100%;
				height: fit-content;
				transform: none !important;
				.face {
					// background: rgba(0, 0, 0, 0.012);
					position: relative;
					width: auto;
					height: auto;
					transform: none !important;
				}
			}
		}
	}

	.prism {
		width: clamp(20rem, 85vw, 45rem); // Wider container tracking
		height: 30vh; // Matches wrapper height seamlessly
		position: relative;
		transform-style: preserve-3d;

		.face {
			position: absolute;
			width: 100%;
			height: 100%;
			// Use Flexbox to force vertical centering even if text wraps
			display: flex;
			align-items: center;
			justify-content: center;
			backface-visibility: hidden; // This keeps the text block centered within the rigid face area
			text-align: center;
			// Cinematic, bold typography rules
			font-family: var(--font-display, 'Playfair Display', serif);
			font-size: clamp(2rem, 2.5vw, 3rem); // Extra large size limits
			font-weight: 900;
			color: var(--text-ink, #2d3748);
			line-height: 1.2; // Allows room for ascending/descending letters like "y"
		}
	}
	.scroll-hint {
		position: absolute;
		bottom: 3.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.15em;
		opacity: 0.6;

		.arrow {
			font-size: 1.25rem;
			margin-top: 0.25rem;
			animation: bounce 1.6s infinite ease-in-out;
		}
	}

	.prompt-form {
		opacity: 0;
		transform: translateY(40px);
		width: 100%;
		margin-top: 2rem;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(45, 55, 72, 0.08);
		padding: 1.75rem;
		border-radius: 1.5rem;
		box-shadow: 0 10px 30px rgba(45, 55, 72, 0.04);
		box-sizing: border-box;

		.section-title {
			font-family: var(--font-display);
			font-size: 2rem;
			margin: 0 0 0.5rem 0;
		}

		.details-body {
			font-size: var(--fs-body);
			margin: 0 0 1.5rem 0;
			opacity: 0.9;
		}
	}

	.date-selector {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 2rem;

		.radio-card {
			display: flex;
			align-items: center;
			padding: 1rem;
			border: 1.5px solid rgba(45, 55, 72, 0.15);
			border-radius: 1rem;
			cursor: pointer;
			transition: all 0.2s ease-out;
			font-weight: 700;

			input {
				margin-right: 1rem;
				accent-color: var(--text-ink);
			}

			&:hover {
				background: rgba(229, 152, 155, 0.1);
				border-color: var(--accent-blush);
			}

			&.active {
				background: rgba(129, 178, 154, 0.12);
				border-color: var(--accent-joy);
			}
		}
	}

	.button-deck {
		display: flex;
		gap: 1rem;
		align-items: center;
		position: relative;
		min-height: 4rem;
	}

	.btn {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 700;
		padding: 0.85rem 1.5rem;
		border-radius: 0.75rem;
		border: none;
		cursor: pointer;
		color: var(--text-ink);
		transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);

		&:hover {
			transform: scale(1.04);
		}

		&.btn-confirm {
			background-color: var(--accent-joy);
			box-shadow: 0 4px 12px rgba(129, 178, 154, 0.3);
		}

		&.btn-cancel {
			background-color: var(--accent-blush);
			box-shadow: 0 4px 12px rgba(229, 152, 155, 0.3);
			position: relative;
			z-index: 5;
			white-space: nowrap;
		}

		&.alternative-confirm {
			animation: pulse 1.5s infinite ease-in-out;
		}
	}

	.success-message {
		text-align: center;
		padding: 1rem 0;

		h2 {
			font-family: var(--font-display);
			font-size: 2.5rem;
			margin: 0 0 0.5rem 0;
		}
	}

	.confetti-holder {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 100;
		overflow: hidden;

		:global(.confetti-piece) {
			position: absolute;
			width: 10px;
			height: 10px;
			border-radius: 2px;
			pointer-events: none;
		}
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(6px);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
</style>
