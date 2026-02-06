=== Media Focus Point ===
Contributors: wpcompany
Tags: focus, focal, image, background, video
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 2.0.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

The Media Focus Point Plugin ensures the key area of an image or video stays visible, regardless of resizing or layout changes.

== Description ==

This plugin makes managing background images or videos effortless by allowing you to set a focus point that stays consistent. Regardless of how the media is resized or the background changes, the focus point ensures that the most important part of your media remains visible and centered.

Ideal for responsive designs and dynamic backgrounds, this tool ensures your media always looks polished and professional on any screen size or resolution.

🚀 See the plugin in action on [WP Company](https://www.wpcompany.nl/ "The WordPress specialist")

== Installation ==

If you installed the plugin and set a focus point on your image or video **it should work right away**.
Most WordPress themes already use this standard WordPress method to render featured images.

*💡 The plugin automatically adds an inline style attribute to the image element, such as:*


    style="object-position: 50% 38%;"

To display an image in your custom template with the focus point applied, you can use the following code snippet:

**For featured images (post thumbnails):**

    <?php
        echo get_the_post_thumbnail('', 'full');
    ?>

**For background images including the background-image:url():**

    <div class="myelement" style="<?= MFP_Background($image_id); ?>"></div>

    <!-- Result -->
    <div class="myelement" style="background-image:url('example.jpg');background-position: 45% 34%;background-size: cover;"></div>

**To omit inline background-image, set second parameter to false:**

    <div class="myelement" style="<?= MFP_Background($image_id, false); ?>"></div>

    <!-- Result -->
    <div class="myelement" style="background-position: 45% 34%;background-size: cover;"></div>

**For images from Advanced Custom Fields (ACF):**

    <?php
    	echo wp_get_attachment_image( get_field('MY-CUSTOM-IMAGE'), 'full' );
    ?>


**To ensure the image fills its  element while maintaining the focus point, use the object-fit property in your CSS. For example:**

    img {
        height: 300px;
        width: 100%;
        object-fit: cover;
    }

**For custom video tags**

    <video src="/path/to/video.mp4" style="<?= MFP_Video_Style($video_id) ?>"></video>

    <!-- Result -->
    <video src="/path/to/video.mp4" style="object-position: 50% 50%;"></video>

**Custom video function**

    <?php MFP_Video($video_id, 'controls autoplay', 'videoClass') ?>

    <!-- Result -->
    <video class="videoClass" controls autoplay style="object-position: 50% 50%; object-fit: cover;">
        <source src="/path/to/video.mp4">
    </video>


== Frequently Asked Questions ==

= How do I set a focus point? =

When you upload an image or video, the default focus point is centered. To change this, follow these steps:

1. Upload your media: After uploading, you’ll see the standard focus point set to the center of the media.
2. Edit the focus point: Below the description fields, you’ll find an option labeled Focus Point. Click on this and then click on the 'Change' button.
3. Select the focus area: A preview of your image or video will appear. Simply click on the part of the media you want to focus on. The plugin will visually mark the selected focus area.
4. Save your selection: After selecting the focus point, click Save. The plugin will record your choice.
5. Adjust percentage: Once saved, you will see two percentage fields: one for the horizontal and one for the vertical focus point. These percentages represent the exact position of your selected focus area relative to the media's dimensions.
6. No additional save required: Once the percentages are set, the focus point is automatically applied, and there’s no need to save the image itself again.

The focus point will now remain centered on the selected area as the media resizes, ensuring the most important parts are always visible, no matter the screen size or layout changes.

= Is this plugin compatible with all themes? =

Yes, the plugin is designed to be compatible with most WordPress themes that use image backgrounds. If you encounter issues, please reach out to our support team.

== Screenshots ==

1. This screenshot displays the Media Focus Point options available for an uploaded image.
2. This screenshot showcases how to set the focus point on an image.
3. This screenshot illustrates how the image resizes while ensuring the focus point remains visible.

== Changelog ==

= 2.0.4 =
* Weird bug when setting focus point for Featured Image or ACF Image fields

= 2.0.3.1 =
* Fixed bug where overlay controls were sometimes visible in locations they shouldn't be.

= 2.0.3 =
* Fixed an issue with overlapping elements when opening the focus point overlay within a media library opened in a block editor.

= 2.0.2 =
* Fixed aspect ratio of wide images while selecting a focus point
* Fixed setting a focus point by mouseclick sometimes resulting in a focus point just outside the image

= 2.0.1 =
* Added custom prefix to all classes to prevent style conflicts

= 2.0 =
* Media Focus Point: now supports video!
* Added Gutenberg-block compatibility for images and videos
* Fixed bug that allowed negative percentages to be manually inserted

= 1.5 =
* Added functionality to allow editing the focus point directly on the attachment detail page without requiring the modal.

= 1.4 =
* Images are no longer draggable while setting a focus point.
* Corrected image boundaries when setting a focus point by clicking on an image.
* Focus point is now shown in number fields to allow for further fine-tuning.
* Fixed a bug where image dimensions were sometimes read too early causing division by zero.

= 1.3 =
* New function MFP_Background to dynamically generate background position for background images.

= 1.2.2 =
* Remove the disabled script that caused errors in certain situations

= 1.2.1 =
* Added banner, icon and screenshot to plugin

= 1.2 =
* Added i18n support

= 1.1 =
* Replaced jQuery with vanilla JavaScript for improved performance and compatibility.

= 1.0 =
* Initial release with the ability to set a focus point on image backgrounds.

== Upgrade Notice ==

= 1.0 =
This is the first stable version of the plugin. Upgrade to enjoy the full functionality of setting and maintaining focus points for media backgrounds.
