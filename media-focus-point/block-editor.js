( function ( wp ) {
	wp.domReady( function () {
		var lastSignature = '';

		function updateFocusedImages() {
			var blocks = wp.data.select( 'core/block-editor' ).getBlocks();
			var focused = {};

			function collect( items ) {
				items.forEach( function ( block ) {
					if ( block.innerBlocks ) {
						collect( block.innerBlocks );
					}
					if ( block.name === 'core/image' && block.attributes.id ) {
						var media = wp.data.select( 'core' ).getMedia( block.attributes.id );
						var position = media && media.meta && media.meta.bg_pos_desktop;
						if ( position && position !== '50% 50%' ) {
							focused[ block.attributes.id ] = position;
						}
					}
				} );
			}

			collect( blocks );
			var signature = Object.keys( focused ).sort().map( function ( id ) {
				return id + ':' + focused[ id ];
			} ).join( ',' );
			if ( signature === lastSignature ) {
				return;
			}
			lastSignature = signature;

			document.querySelectorAll( '.wp-block-image img.wp-image-' ).forEach( function ( image ) {
				var match = image.className.match( /wp-image-(\d+)/ );
				if ( match ) {
					var position = focused[ match[1] ];
					image.classList.toggle( 'media-focus-point', !! position );
					image.style.objectPosition = position || '';
				}
			} );
		}

		wp.data.subscribe( updateFocusedImages );
		updateFocusedImages();
	} );
} )( window.wp );
