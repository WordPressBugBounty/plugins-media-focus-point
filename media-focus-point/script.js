let d_left = null;
let d_right = null;
let bgX = 0;
let bgY = 0;
let centered_text = 'Centered (default)';
let imageWt = 0;
let imageHt = 0;
let containerHt = 0;
let containerWt = 0;
let rec_left = 0;
let rec_top = 0;

// Replaces the custom HTML element with a standard video element
function replaceCustomVideoElements() {
	document.querySelectorAll('wpcmfp-video').forEach((customEl, index) => {
		const videoEl = document.createElement('video');
		for (const attr of customEl.attributes) {
			videoEl.setAttribute(attr.name, attr.value);
		}
		// While the custom element has children we move them to the new video element
		while (customEl.firstChild) {
			videoEl.appendChild(customEl.firstChild); // takes the first child and moves it to the new video element
		}
		customEl.parentNode.replaceChild(videoEl, customEl);
	});
}

function onNumberInputChange() {
	const inputX = document.getElementById('wpcmfp_desktop_value_x');
	const inputY = document.getElementById('wpcmfp_desktop_value_y');
	const hidden_input = document.getElementById('wpcmfp_bg_pos_desktop_id');

	// As values are percentages, and it doesn't make sense to place focus outside of the image, we use 100 as a maximum value
	if (inputX.value > 100) {
		inputX.value = 100;
	}
	if (inputY.value > 100) {
		inputY.value = 100;
	}

	// Concatenate number input values to correct CSS syntax
	hidden_input.value = `${inputX.value}% ${inputY.value}%`;
}

function set_bg_values() {
	let d = document.getElementById("wpcmfp_bg_pos_desktop_id").value.replaceAll('%', '');
	d_left = d.split(' ')[0];
	d_right = d.split(' ')[1];
}

function cancel_focus() {
	document.querySelectorAll(".wpcmfp-media-frame-content,.wpcmfp-media-sidebar").forEach(el => el.classList.remove('wpcmfp-show'));
	document.querySelector('.wpcmfp-overlay').classList.remove('wpcmfp-show');
}

function close_overlay() {
	const inputX = document.getElementById('wpcmfp_desktop_value_x');
	const inputY = document.getElementById('wpcmfp_desktop_value_y');
	document.querySelectorAll(".wpcmfp-media-frame-content.wpcmfp-media-sidebar").forEach(el => el.classList.remove('wpcmfp-show'));
	document.querySelector('.wpcmfp-overlay').classList.remove('wpcmfp-show');

	d_left = bgX;
	d_right = bgY;

	if (isNaN(bgX) || isNaN(bgY)) {
		d_left = inputX.value;
		d_right = inputY.value;
		bgX = Number(inputX.value);
		bgY = Number(inputY.value);
	}

	// If a coordinate is somehow negative, set it to 0 instead
	if (bgX < 0) bgX = 0;
	if (bgY < 0) bgY = 0;

	document.getElementById('wpcmfp_bg_pos_desktop_id').value = `${bgX}% ${bgY}%`;
	document.getElementById('wpcmfp_desktop_value_x').value = bgX;
	document.getElementById('wpcmfp_desktop_value_y').value = bgY;
	// Trigger change event to save new values
	triggerChange(document.getElementById('wpcmfp_bg_pos_desktop_id'));

	if (bgX == 50 && bgY == 50) {
		document.getElementById("wpcmfp_desktop_value_label").innerHTML = centered_text;
		document.getElementById("wpcmfp_label_desktop").setAttribute('value', 'Set');
	} else {
		document.getElementById("wpcmfp_desktop_value_label").innerHTML = '';
		document.getElementById("wpcmfp_label_desktop").setAttribute('value', 'Change');
		document.getElementById("wpcmfp_reset_desktop").style.display = 'inline';
	}

	// Automatically save the page if editing an attachment directly (not via media modal)
	const isAttachmentEditPage = document.body.classList.contains('post-type-attachment');
	if (isAttachmentEditPage && !document.querySelector('.media-modal')) {
		const postForm = document.getElementById('post');
		if (postForm) {
			postForm.submit();
		}
	}
}

function triggerChange(element) {
	if (element) {
		const changeEvent = new Event('change', {
			'bubbles': true,
			'cancelable': true
		});

		element.dispatchEvent(changeEvent);
	}
}

function waitForMediaLoad(media) {
	return new Promise((resolve) => {
		if (media.tagName.toLowerCase() === "video") {
			if (media.readyState >= 2) {
				resolve(media);
			} else {
				media.onloadeddata = () => resolve(media);
			}
		} else {
			if (media.complete) {
				resolve(media);
			} else {
				media.onload = () => resolve(media);
			}
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	document.addEventListener('click', function (e) {
		if (e.target.classList.contains('wpcmfp-button')) {
			const button = e.target;
			if (button.classList.contains('button-secondary')) {
				button.classList.remove('button-secondary');
				button.classList.add('button-primary');
			} else if (button.classList.contains('button-primary')) {
				button.classList.remove('button-primary');
				button.classList.add('button-secondary');
			}
		}
	});
});

async function set_focus(e) {
	const hiddenInput = document.getElementById('wpcmfp_bg_pos_desktop_id');
	const mediaContainer = document.querySelector('.wpcmfp-container');
	const overlay = document.querySelector('.wpcmfp-overlay');
	const mediaPreviewContainer = document.createElement('div');
	// If the overlay doesn't contain the contains-video class, it will hide the controls toggle button
	if (hiddenInput.dataset.isVideo === '1') {
		overlay.classList.add('contains-video');
	} else {
		overlay.classList.remove('contains-video');
	}
	mediaPreviewContainer.classList.add('wpcmfp-media-preview-container');
	// Fetch data-attribute data-media-tag, which should contain a base64 encoded string of the media tag
	mediaPreviewContainer.innerHTML = atob(hiddenInput.dataset.mediaTag);
	// Save pin to add back again later
	const pin = mediaContainer.querySelector('.wpcmfp-pin');
	// Clear overlay contents
	mediaContainer.innerHTML = '';
	// Re-add the pin
	if (pin) mediaContainer.append(pin);
	// Add image to overlay
	mediaContainer.append(mediaPreviewContainer);

	replaceCustomVideoElements()
	document.querySelectorAll(".wpcmfp-media-frame-content,.wpcmfp-media-sidebar").forEach(el => el.classList.add('show'));
	document.querySelectorAll(".wpcmfp-media-toolbar,.wpcmfp-media-menu-item").forEach(el => el.style.zIndex = 0);
	set_bg_values();
	document.querySelector('.wpcmfp-overlay').classList.add('wpcmfp-show');
	attachMediaClickListener();

	const container = document.querySelector(".wpcmfp-image_focus_point .wpcmfp-container");
	const media = container.querySelector("img") || container.querySelector("video");

	if (!media || !container) {
		console.error("Media element or container not found in set_focus");
		return;
	}

	await waitForMediaLoad(media);
	const rect = media.getBoundingClientRect();
	containerHt = container.clientHeight;
	containerWt = container.clientWidth;
	// This part calculates the position of the point on the image
	const marginLeft = (containerWt - rect.width) / 2; // Whitespace between the container and image
	const marginTop = (containerHt - rect.height) / 2;
	let relX = (e.clientX - rect.left) + marginLeft; // Calculate the location in px. + adding the margin so that the dot never goes outside the image
	let relY = (e.clientY - rect.top) + marginTop;

	// When the number is NaN. It means that the user has not interacted with the image.
	// So we will calculate the position of the dot based on the input value.
	if (Number.isNaN(relX) || Number.isNaN(relY)) {
		const inputX = document.getElementById('wpcmfp_desktop_value_x'); // reading out the input values
		const inputY = document.getElementById('wpcmfp_desktop_value_y');
		inputX.value = Math.max(0, Math.min(100, inputX.value));
		inputY.value = Math.max(0, Math.min(100, inputY.value));

		const inputX_px = (rect.width / 100) * inputX.value; // Convert the input value % to px
		const inputY_px = (rect.height / 100) * inputY.value;
		const marginX = (containerWt - rect.width) / 2; // get the offset of the left (this is in px)
		const marginY = (containerHt - rect.height) / 2;
		const totalX = inputX_px + marginX; // Combine the offset and the input value
		const totalY = inputY_px + marginY;
		relX = totalX; // Set the value of rel to total
		relY = totalY;
	}

	// this part calculated the percentage that will be given to the image on websites.
	bgX = Math.round(((e.clientX - rect.left) / containerWt) * 100);
	bgY = Math.round(((e.clientY - rect.top) / containerHt) * 100);
	rec_left = Math.round((relX / containerWt) * 100); // Converting the values to percentages
	rec_top = Math.round((relY / containerHt) * 100);

	document.querySelector('.wpcmfp-pin').style.left = `${rec_left}%`;
	document.querySelector('.wpcmfp-pin').style.top = `${rec_top}%`;
}

function reset_focus() {
	bgX = 50;
	bgY = 50;
	document.querySelector(".wpcmfp-overlay .wpcmfp-pin").style.left = '50%';
	document.querySelector(".wpcmfp-overlay .wpcmfp-pin").style.top = '50%';
	document.getElementById("wpcmfp_reset_desktop").style.display = 'none';
	close_overlay();
}

// toggle video controls when the button is clicked
function toggle_controls() {
	const videos = document.querySelectorAll('.wpcmfp-video');
	videos.forEach(function (video) {
		if (video.hasAttribute('controls')) {
			video.removeAttribute('controls');
		} else {
			video.setAttribute('controls', '');
		}
	});
}

function attachMediaClickListener() {
	const container = document.querySelector(".wpcmfp-overlay .wpcmfp-container");
	const media = container.querySelector("img") || container.querySelector("video");

	if (media) {
		media.addEventListener('click', function (e) {
			const rect = media.getBoundingClientRect();

			// This part calculates the position of the point on the image
			let marginLeft = (containerWt - rect.width) / 2; // Whitespace between the container and image
			if (marginLeft > containerWt) {
				marginLeft = (rect.width - containerWt) / 2
			}
			const marginTop = (containerHt - rect.height) / 2;
			const relX = (e.clientX - rect.left) + marginLeft; // Calculate the location in px. + adding the margin so that the dot never goes outside the image
			const relY = (e.clientY - rect.top) + marginTop;
			rec_left = Math.round((relX / containerWt) * 100); // Converting the values to percentages
			rec_top = Math.round((relY / containerHt) * 100);

			// this part calculated the percentage that will be given to the image on websites.
			bgX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
			bgY = Math.round(((e.clientY - rect.top) / rect.height) * 100);

			document.querySelector('.wpcmfp-pin').style.left = `${rec_left}%`;
			document.querySelector('.wpcmfp-pin').style.top = `${rec_top}%`;
		});
	} else {
		console.error("Media element not found!");
	}
}
