( function ( wp ) {
	wp.domReady( function () {
		var positions = window.wpcmfpEditorData && window.wpcmfpEditorData.positions || {};
		Object.keys( positions ).forEach( function ( id ) {
			positions[ 'id:' + id ] = positions[ id ];
			delete positions[ id ];
		} );
		var pending = {};
		var scheduled = false;
		var canvasObserver = null;

		function getCanvasDocument() {
			var iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
			return iframe && iframe.contentDocument;
		}

		function scheduleUpdate() {
			if ( scheduled ) {
				return;
			}
			scheduled = true;
			window.requestAnimationFrame( function () {
				scheduled = false;
				ensureCanvasObserver();
				updateFocusedImages();
			} );
		}

		function loadPosition( id, url ) {
			var key = id ? 'id:' + id : 'url:' + url;
			if ( positions[ key ] !== undefined || pending[ key ] ) {
				return;
			}
			if ( id ) {
				var media = wp.data.select( 'core' ).getMedia( id );
				var position = media && ( media.wpcmfp_focus_point || media.meta && media.meta.bg_pos_desktop );
				if ( position !== undefined ) {
					positions[ key ] = position || '';
					return;
				}
			}
			var path = id ? '/wp/v2/media/' + id + '?context=edit' : '/wp/v2/media?search=' + encodeURIComponent( getFilename( url ) ) + '&per_page=100&context=edit';
			pending[ key ] = wp.apiFetch( { path: path } )
				.then( function ( fetchedMedia ) {
					var mediaItem = id ? fetchedMedia : findMediaByUrl( fetchedMedia, url );
					positions[ key ] = mediaItem && ( mediaItem.wpcmfp_focus_point || mediaItem.meta && mediaItem.meta.bg_pos_desktop ) || '';
				} )
				.catch( function () { positions[ key ] = ''; } )
				.finally( function () { delete pending[ key ]; scheduleUpdate(); } );
		}

		function getFilename( url ) {
			return decodeURIComponent( url.split( '?' )[ 0 ].split( '/' ).pop() );
		}

		function normalizeFilename( filename ) {
			return filename.toLowerCase().replace( /-\d+x\d+(?=\.[^.]+$)/, '' );
		}

		function findMediaByUrl( mediaItems, url ) {
			var requested = normalizeFilename( getFilename( url ) );
			return mediaItems.find( function ( mediaItem ) {
				return mediaItem.source_url && normalizeFilename( getFilename( mediaItem.source_url ) ) === requested;
			} ) || mediaItems[ 0 ];
		}

		function updateFocusedImages() {
			var canvasDocument = getCanvasDocument();
			if ( ! canvasDocument || ! canvasDocument.body ) return;
			var blocks = wp.data.select( 'core/block-editor' ).getBlocks();
			var imageBlocks = [];
			function collect( items ) {
				items.forEach( function ( block ) {
					if ( block.innerBlocks ) collect( block.innerBlocks );
					if ( block.name === 'core/image' ) {
						imageBlocks.push( block );
						if ( block.attributes.id || block.attributes.url ) loadPosition( block.attributes.id, block.attributes.url );
					}
				} );
			}
			collect( blocks );
			canvasDocument.querySelectorAll( '.wp-block-image img.media-focus-point' ).forEach( function ( image ) {
				image.classList.remove( 'media-focus-point' );
				image.style.removeProperty( 'object-position' );
			} );
			imageBlocks.forEach( function ( block ) {
				var blockElement = canvasDocument.querySelector( '[data-block="' + block.clientId + '"]' );
				var image = blockElement && blockElement.querySelector( '.wp-block-image img, img' );
				var url = block.attributes.url || image && image.currentSrc || image && image.src || '';
				var key = block.attributes.id ? 'id:' + block.attributes.id : 'url:' + url;
				if ( url && ! block.attributes.id && positions[ key ] === undefined ) loadPosition( null, url );
				var position = positions[ key ];
				var focused = position && position !== '50% 50%';
				if ( image ) {
					image.classList.toggle( 'media-focus-point', !! focused );
					if ( focused ) image.style.setProperty( 'object-position', position, 'important' );
				}
			} );
		}

		function ensureCanvasObserver() {
			var iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
			var canvasDocument = getCanvasDocument();
			if ( iframe && ! iframe.dataset.wpcmfpObserver ) {
				iframe.addEventListener( 'load', scheduleUpdate );
				iframe.dataset.wpcmfpObserver = '1';
			}
			if ( canvasDocument && canvasDocument.body && ! canvasObserver ) {
				canvasObserver = new MutationObserver( scheduleUpdate );
				canvasObserver.observe( canvasDocument.body, { childList: true, subtree: true, attributes: true, attributeFilter: [ 'class', 'style' ] } );
			}
		}

		var parentObserver = new MutationObserver( function () { ensureCanvasObserver(); scheduleUpdate(); } );
		parentObserver.observe( document.body, { childList: true, subtree: true } );
		wp.data.subscribe( scheduleUpdate );
		scheduleUpdate();
	} );
} )( window.wp );
