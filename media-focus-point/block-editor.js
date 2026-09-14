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
		var syncingGenerateBlocks = false;
		var generateBlocksFallbacks = {};
		var generateBlocksOverrides = {};

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
				syncGenerateBlocksFocusPoints();
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

			var path = id
				? '/wp/v2/media/' + id + '?context=edit'
				: '/wp/v2/media?search=' + encodeURIComponent( getFilename( url ) ) + '&per_page=100&context=edit';
			pending[ key ] = wp.apiFetch( { path: path } )
				.then( function ( fetchedMedia ) {
					var mediaItem = id ? fetchedMedia : findMediaByUrl( fetchedMedia, url );
					positions[ key ] = mediaItem && ( mediaItem.wpcmfp_focus_point || mediaItem.meta && mediaItem.meta.bg_pos_desktop ) || '';
				} )
				.catch( function () {
					positions[ key ] = '';
				} )
				.finally( function () {
					delete pending[ key ];
					scheduleUpdate();
				} );
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
			} );
		}

		function getBackgroundImageUrl( value ) {
			if ( typeof value !== 'string' ) {
				return '';
			}

			var match = value.match( /url\(\s*["']?([^"')]+)["']?\s*\)/i );
			return match ? match[ 1 ] : '';
		}

		function isDefaultBackgroundPosition( value ) {
			return ! value || [ '50% 50%', 'center', 'center center' ].indexOf( value.trim().toLowerCase() ) !== -1;
		}

		function isDefaultFocalPoint( focalPoint ) {
			return ! focalPoint || ( focalPoint.x === 0.5 && focalPoint.y === 0.5 );
		}

		function walkGenerateBlocksStyles( value, callback ) {
			if ( ! value || typeof value !== 'object' ) {
				return value;
			}

			if ( Array.isArray( value ) ) {
				return value.map( function ( item ) {
					return walkGenerateBlocksStyles( item, callback );
				} );
			}

			var result = {};
			Object.keys( value ).forEach( function ( key ) {
				result[ key ] = walkGenerateBlocksStyles( value[ key ], callback );
			} );
			return callback( result );
		}

		function syncGenerateBlocksFocusPoints() {
			if ( syncingGenerateBlocks || ! wp.data.select( 'core/block-editor' ) ) {
				return;
			}

			var blocks = wp.data.select( 'core/block-editor' ).getBlocks();
			var blockEditor = wp.data.dispatch( 'core/block-editor' );
			if ( ! blockEditor || ! blockEditor.updateBlockAttributes ) {
				return;
			}

			function collect( items ) {
				var result = [];
				items.forEach( function ( block ) {
					if ( block.innerBlocks ) {
						result = result.concat( collect( block.innerBlocks ) );
					}
					if ( block.name && block.name.indexOf( 'generateblocks/' ) === 0 ) {
						result.push( block );
					}
				} );
				return result;
			}

			collect( blocks ).forEach( function ( block ) {
				if ( generateBlocksOverrides[ block.clientId ] ) {
					return;
				}

				var styles = block.attributes && block.attributes.styles;
				if ( ! styles || typeof styles !== 'object' ) {
					return;
				}

				var changed = false;
				var updatedStyles = walkGenerateBlocksStyles( styles, function ( style ) {
					var imageUrl = getBackgroundImageUrl( style.backgroundImage );
					var mediaId = style.media && style.media.id;
					if ( ! imageUrl && ! mediaId ) {
						return style;
					}

					var key = mediaId ? 'id:' + mediaId : 'url:' + imageUrl;
					if ( positions[ key ] === undefined ) {
						loadPosition( mediaId || null, imageUrl );
						return style;
					}

					var position = positions[ key ];
					var currentPosition = style.backgroundPosition;
					if ( ! position ) {
						return style;
					}

					if ( ! isDefaultBackgroundPosition( currentPosition ) ) {
						generateBlocksOverrides[ block.clientId ] = true;
						return style;
					}

					if ( generateBlocksFallbacks[ block.clientId ] || currentPosition === position ) {
						return style;
					}

					changed = true;
					return Object.assign( {}, style, { backgroundPosition: position } );
				} );

				if ( changed ) {
					generateBlocksFallbacks[ block.clientId ] = true;
					syncingGenerateBlocks = true;
					blockEditor.updateBlockAttributes( block.clientId, { styles: updatedStyles } );
					syncingGenerateBlocks = false;
				}
			} );
		}

		function updateFocusedImages() {
			var canvasDocument = getCanvasDocument();
			if ( ! canvasDocument || ! canvasDocument.body ) {
				return;
			}

			var blocks = wp.data.select( 'core/block-editor' ).getBlocks();
			var imageBlocks = [];

			function collect( items ) {
				items.forEach( function ( block ) {
					if ( block.innerBlocks ) {
						collect( block.innerBlocks );
					}
					if ( block.name === 'core/image' ) {
						imageBlocks.push( block );
						if ( block.attributes.id || block.attributes.url ) {
							loadPosition( block.attributes.id, block.attributes.url );
						}
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
				var media = block.attributes.id && wp.data.select( 'core' ).getMedia( block.attributes.id );
				var mediaPosition = media && ( media.wpcmfp_focus_point || media.meta && media.meta.bg_pos_desktop );
				if ( mediaPosition !== undefined ) {
					positions[ key ] = mediaPosition || '';
				}
				if ( url && ! block.attributes.id && positions[ key ] === undefined ) {
					loadPosition( null, url );
				}
				var focalPoint = block.attributes.focalPoint;
				var position = ! isDefaultFocalPoint( focalPoint )
					? Math.round( focalPoint.x * 100 ) + '% ' + Math.round( focalPoint.y * 100 ) + '%'
					: positions[ key ];
				var focused = position && position !== '50% 50%';
				if ( image ) {
					image.classList.toggle( 'media-focus-point', !! focused );
					if ( focused ) {
						image.style.setProperty( 'object-position', position, 'important' );
					}
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
				canvasObserver.observe( canvasDocument.body, {
					childList: true,
					subtree: true,
					attributes: true,
					attributeFilter: [ 'class', 'style' ]
				} );
			}
		}

		var parentObserver = new MutationObserver( function () {
			ensureCanvasObserver();
			scheduleUpdate();
		} );
		parentObserver.observe( document.body, { childList: true, subtree: true } );
		wp.data.subscribe( scheduleUpdate );
		scheduleUpdate();
	} );
} )( window.wp );
