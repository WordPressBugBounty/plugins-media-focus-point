(function () {
	'use strict';

	const data = window.wpcmfpCornerstoneData || {};
	const focusPoints = data.focusPoints || {};

	function imagePath(value) {
		if (!value) {
			return '';
		}

		try {
			return new URL(value, window.location.href).pathname;
		} catch (error) {
			return String(value).split('?')[0].split('#')[0];
		}
	}

	function focusPointForUrl(value) {
		const path = imagePath(value);
		return path ? focusPoints[path] || '' : '';
	}

	function urlsFromValue(value) {
		const urls = [];
		const pattern = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;
		let match;

		while ((match = pattern.exec(value || '')) !== null) {
			urls.push(match[1]);
		}

		return urls;
	}

	function applyToLayer(layer, focusPoint) {
		if (focusPoint) {
			layer.style.setProperty('background-position', focusPoint, 'important');
		}
	}

	function applyToElement(element) {
		if (!element || element.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		const layers = element.matches('.x-bg-layer-lower-image, .x-bg-layer-upper-image')
			? [element]
			: Array.from(element.querySelectorAll('.x-bg-layer-lower-image, .x-bg-layer-upper-image'));

		if (!layers.length) {
			return;
		}

		const inlineUrls = element.getAttribute('style')
			? urlsFromValue(element.getAttribute('style'))
			: [];
		const inlineFocusPoint = inlineUrls
			.map(focusPointForUrl)
			.find(Boolean);

		layers.forEach((layer) => {
			const computedUrls = urlsFromValue(getComputedStyle(layer).backgroundImage);
			const computedFocusPoint = computedUrls
				.map(focusPointForUrl)
				.find(Boolean);

			applyToLayer(layer, inlineFocusPoint || computedFocusPoint);
		});
	}

	function initialize() {
		document.querySelectorAll('.x-bg-layer-lower-image, .x-bg-layer-upper-image').forEach(applyToElement);
		document.querySelectorAll('[style*="url("]').forEach(applyToElement);

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes') {
					applyToElement(mutation.target);
				}

				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						applyToElement(node);
					}
				});
			});
		});

		observer.observe(document.body, {
			attributes: true,
			attributeFilter: ['style'],
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
