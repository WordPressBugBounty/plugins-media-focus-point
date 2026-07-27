(function () {
	'use strict';

	const selector = '[data-wpcmfp-focus-point]';

	function applyFocusPoint(element) {
		const focusPoint = element.getAttribute('data-wpcmfp-focus-point');

		if (focusPoint) {
			element.style.objectPosition = focusPoint;
		}
	}

	function applyFocusPoints(root) {
		if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
			return;
		}

		if (root.nodeType === Node.ELEMENT_NODE && root.matches(selector)) {
			applyFocusPoint(root);
		}

		root.querySelectorAll(selector).forEach(applyFocusPoint);
	}

	function initialize() {
		applyFocusPoints(document);

		/*
		 * Blocksy can inject images after page load (for example in quick-view
		 * and infinite-scroll content), so apply the same focus point there.
		 */
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach(applyFocusPoints);
			});
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		initialize();
	}
})();
