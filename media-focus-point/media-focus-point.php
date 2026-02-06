<?php
/**
 * Plugin Name: Media Focus Point
 * Description: Ensures that your selected focus area of an image or video remains centered and visible, even when resized.
 * Version: 2.0.4
 * Author: WP Company
 * Author URI: https://www.wpcompany.nl
 * Text Domain: media-focus-point
 * Domain Path: /languages
 * Tested up to: 6.9
 * License: GPLv3 or later
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Add custom media field to image/video attachments
function wpcmfp_media_add_media_custom_field( $form_fields, $post ) {
    $field_value = get_post_meta( $post->ID, 'bg_pos_desktop', true );
    $disabled = ($field_value && $field_value != '50% 50%') ? '' : 'style="display:none"';
    $label = ($field_value && $field_value != '50% 50%') ? 'Change' : 'Set';
    $field_value = ($field_value) ? $field_value : '50% 50%';
    $is_video = false;

    $mime_type = get_post_mime_type( $post->ID );

    // Detect if it's a video or image
    if ( strpos( $mime_type, 'video' ) !== false ) {
        $media_url = wp_get_attachment_url( $post->ID );
        $is_video = true;
        // Here we use a custom video tag. This prevents the MEJS (the WordPress video player)
        // from injecting its video player around this video.
        // This is necessary because MEJS doesn't support many video formats,
        // and it also doesn't support toggling the controls, which would result in messy code.
        // After MEJS is loaded, we replace the custom video tag with a standard video tag.
        $media_tag = '<wpcmfp-video class="wpcmfp-video" preload="metadata" ondragstart="return false;" style="max-height:100%;"><source src="' . esc_url( $media_url ). '"></wpcmfp-video>';
    } else {
        $media_tag = wp_get_attachment_image( $post->ID, 'full' );
        $image_data = wp_get_attachment_image_src( $post->ID, 'full' );
        $image_width = isset( $image_data[1] ) ? $image_data[1] : 'auto'; // fallback to auto if not available
        // Add ondragstart attribute which prevents the media from being accidentally dragged and triggering the upload overlay
        $media_tag = str_replace(
            '<img',
            '<img sizes="' . esc_attr( $image_width ) . 'px" ondragstart="return false;"',
            $media_tag
        );
    }

    // Split position
    $field_value_array = str_replace( '%', '', $field_value );
    $field_value_array = explode( ' ', $field_value_array );
    $value_x = $field_value_array[0];
    $value_y = $field_value_array[1];

    $html = '
        <input 
            type="hidden"
            value="' . esc_attr( $field_value ) . '"
            id="wpcmfp_bg_pos_desktop_id" 
            name="attachments[' . $post->ID . '][bg_pos_desktop]"
            data-media-tag="' . esc_attr( base64_encode($media_tag) ) . '" 
            data-is-video="' . ($is_video ? '1' : '0') . '"
        >
        <div class="wpcmfp-focusp_label_holder">
            <div id="wpcmfp_desktop_value">
                <input
                    id="wpcmfp_desktop_value_x"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    title="' . __( 'This field contains the X-percentage', 'media-focus-point' ) . '" value="' . $value_x . '"
                    onchange="onNumberInputChange(this)" />%
                    <input id="wpcmfp_desktop_value_y" type="number" min="0" max="100" step="1" title="' . __( 'This field contains the Y-percentage', 'media-focus-point' ) . '" value="' . $value_y . '" onchange="onNumberInputChange(this)" />%
                <div id="wpcmfp_desktop_value_label"></div>
            </div>
                <input
                    type="button"
                    class="button button-primary button-small"
                    id="wpcmfp_label_desktop"
                    onclick="set_focus(0)"
                    value="' . $label . '"
                >
                <input
                    type="button"
                    class="button button-secondary button-small"
                    id="wpcmfp_reset_desktop"
                    onclick="reset_focus()"
                    value="' . __( 'Reset', 'media-focus-point' ) . '" ' . $disabled . '
                >
            </div>
    ';

    $form_fields['background_position_desktop'] = array(
        'value' => $field_value ?: '',
        'label' => __( 'Media Focus Point', 'media-focus-point' ),
        'input' => 'html',
        'html'  => $html
    );

    return $form_fields;
}
add_filter( 'attachment_fields_to_edit', 'wpcmfp_media_add_media_custom_field', null, 2 );


// Save media field
function wpcmfp_media_save_attachment( $attachment_id ) {
    if ( isset( $_REQUEST['attachments'][ $attachment_id ]['bg_pos_desktop'] ) ) {
        $bg_pos_desktop = sanitize_text_field( wp_unslash( $_REQUEST['attachments'][ $attachment_id ]['bg_pos_desktop'] ) );
        update_post_meta( $attachment_id, 'bg_pos_desktop', $bg_pos_desktop );
    }
}

add_action( 'edit_attachment', 'wpcmfp_media_save_attachment' );


// Filter: apply object-position to <img>
function wpcmfp_filter_gallery_img_attributes( $atts, $attachment ) {
    $bg_pos_desktop = get_post_meta( $attachment->ID, 'bg_pos_desktop', true );

    if ( ! empty( $bg_pos_desktop ) ) {
        $style = "object-position: " . esc_attr( $bg_pos_desktop ) . ';';
        $atts['style'] = isset( $atts['style'] ) ? $atts['style'] . ' ' . $style : $style;
    }

    return $atts;
}
add_filter( 'wp_get_attachment_image_attributes', 'wpcmfp_filter_gallery_img_attributes', 10, 2 );


// Function that is called when a video block is rendered
function wpcmfp_filter_gallery_video_attributes( $atts, $attachment ) {
    // Retrieve custom meta field value for background position
    $bg_pos_desktop = get_post_meta( $attachment->ID, 'bg_pos_desktop', true );

    // If a background position is set, apply it as a style attribute
    if ( ! empty( $bg_pos_desktop ) ) {
        $style = "object-position: " . esc_attr( $bg_pos_desktop ) . ';';
        // Add the background position style to any existing styles
        $atts['style'] = isset( $atts['style'] ) ? $atts['style'] . ' ' . $style : $style;
    }

    // Return the modified attributes
    return $atts;
}

// Apply a filter when rendering block content
add_filter('render_block', function ($block_content, $block) {
    // Check if the block is a video and has an 'id' attribute
    if (in_array($block['blockName'], ['core/video', 'core/image']) && isset($block['attrs']['id'])) {
        $media_id = $block['attrs']['id']; // Get the video or photo ID
        $object_position = get_post_meta($media_id, 'bg_pos_desktop', true);

        // If a background position is defined, apply it
        if (!empty($object_position)) {
            $style = 'object-position: ' . esc_attr($object_position) . ';';
            if ($block['blockName'] === 'core/video') {
                $style .= 'object-fit: cover;'; // Initialize style variable
            }
            $tag = $block['blockName'] === 'core/video' ? 'video' : 'img';
            $block_content = preg_replace_callback(
                '#<' . $tag . '([^>]*)>#',
                function ($matches) use ($style, $tag) {
                    $attrs = $matches[1];
                    // Append the new style to the existing style attribute
                    if (strpos($attrs, 'style=') !== false) {
                        $attrs = preg_replace_callback(
                            '/style=("|\')(.*?)\1/',
                            // function that checks if there is already a semicolon else it will add one.
                            function ($style_matches) use ($style) {
                                $existing_style = $style_matches[2];
                                // if the existing style doesn't end with a semicolon, add one
                                if (substr(trim($existing_style), -1) !== ';') {
                                    $existing_style .= ';';
                                }
                                return 'style="' . $existing_style . ' ' . esc_attr($style) . '"';
                            },
                            $attrs
                        );
                    } else {
                        // Add a new 'style' attribute if it doesn't exist
                        $attrs .= ' style="' . esc_attr($style) . '"';
                    }
                    return '<' . $tag . $attrs . '>';
                },
                $block_content
            );
        }
    }

    return $block_content;
}, 10, 2);

// Enqueue admin styles/scripts
function wpcmfp_media_focus_point_admin_scripts() {
    wp_enqueue_style( 'wpc-mfp-css', plugin_dir_url( __FILE__ ) . 'admin.css', [], filemtime( __FILE__ ) );
    wp_enqueue_script( 'wpc-mfp-js', plugin_dir_url( __FILE__ ) . 'script.js', [], filemtime( __FILE__ ), ['in_footer' => true] );
}
add_action( 'admin_enqueue_scripts', 'wpcmfp_media_focus_point_admin_scripts' );


// Helper: Get background style for images (and optionally videos)
function MFP_Background( $attachment_id, $include_image = true ) {
    // Get the stored background position
    $bg_pos_desktop = get_post_meta( $attachment_id, 'bg_pos_desktop', true );

    // Default background position if not set
    if ( empty( $bg_pos_desktop ) ) {
        $bg_pos_desktop = '50% 50%';
    }

    // Start building the style
    $style = 'background-position: ' . esc_attr( $bg_pos_desktop ) . ';';

    // Include background-image if enabled
    if ( $include_image ) {
        $image_url = wp_get_attachment_url( $attachment_id );
        if ( $image_url ) {
            $style = 'background-image: url(' . esc_url( $image_url ) . '); ' . $style . ' background-size: cover;';
        }
    }

    return $style;
}

// Functions that the user can use for getting the style for videos
function MFP_Video_Style( $attachment_id, $include_video = true ) {
    $bg_pos_desktop = get_post_meta( $attachment_id, 'bg_pos_desktop', true );
    if ( empty( $bg_pos_desktop ) ) {
        $bg_pos_desktop = '50% 50%';
    }

    $style = 'object-position: ' . esc_attr( $bg_pos_desktop ) . ';';

    if ( $include_video ) {
        $video_url = wp_get_attachment_url( $attachment_id );
        if ( $video_url ) {
            $style = $style . 'object-fit: cover;';
        }
    }
    return $style;
}

// Function that the user can use for getting a video tag with the correct style and src.
function MFP_Video($video_id, $attribute_string = '', $class_string = '') {
    $video_url = wp_get_attachment_url($video_id);

    if ($video_url) {
        $style = MFP_Video_Style($video_id); // Get the style for the video
        $class_part = '';

        if ($class_string) {
            $class_part = ' class="' . esc_attr($class_string) . '"';
        }

        echo '<video style="' . esc_attr($style) . '"' . $class_part . $attribute_string . '>';
        echo '    <source src="' . esc_url($video_url) . '">';
        echo '</video>';
    } else {
        error_log("Could not retrieve video url for attachment ID");
    }
}

add_action( 'admin_footer', function() {
    ?>
    <style>.wpcmfp-overlay: display: none;</style>
    <div class="wpcmfp-overlay wpcmfp-image_focus_point">
        <div class="wpcmfp-img-container">
            <div class="wpcmfp-header">
                <div class="wpcmfp-wrapp">
                    <h3><?= __( 'Click on the media to set the focus point', 'media-focus-point' ) ?></h3>
                    <div class="wpcmfp-controls">
                        <span class="wpcmfp-button button-secondary wpcmfp-button wpcmfp-toggle-video-controls" onclick="toggle_controls()">
                            <?= __( 'Toggle Controls', 'media-focus-point' ) ?>
                        </span>
                        <span class="button button-secondary" onclick="cancel_focus()">
                            <?= __( 'Cancel', 'media-focus-point' ) ?>
                        </span>
                        <span class="button button-primary" onclick="close_overlay()">
                            <?= __( 'Save', 'media-focus-point' ) ?>
                        </span>
                    </div>
                </div>
            </div>
            <div class="wpcmfp-container">
                <div class="wpcmfp-pin"></div>
            </div>
        </div>
    </div>
    <?php
} );