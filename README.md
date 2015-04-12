# OOCSS
A minimalist, but extra handy CSS toolkit for rapid website design

## Table of Contents
 - [Panels](#panels)
 - [Menus](#menus)
 - [Embeddables](#embeddables)

## Panels
This is the real workhorse of this library, it acts as a float-container but rather than using clear-float madness, it simply creates a new Block Formatting Context

`.panel`
Creates a panel in which you can place any kind of content, even floats without it expanding outside it's bounds. 
Doesn't do anything to help with absolute/relative positioning.
Behind the scenes it uses some Block Formatting Context magic to avoid the normal clearing of floats.

`.panel-left` and `.panel-right`
Both sit b-e-a-utifully to the side of any panel it's next to.
By default, it gives you an EM-width of space away from the connected panel.

## Menus

`.menu`
Creates a menu out of a given list-like object, just tag each contained menu-item with `.menu-item`.
Defaults to a horizontal menu with natural spacing between items.

`.menu-float`
Works with the ".menu" container. Sets the menu so that each menu-item horizontally follows the next with no space in-between. 

`.menu-vertical`
Works on the ".menu" container. Sets the menu so that it is aligned vertically.

## Embeddables

`.aspect`
Gives an aspect ratio to otherwise freeform objects like Video, Flash and other plugins.
Defaults to 16:9 ratio.
Simply tag the otherwise adaptable-size object we want to restrict with `.adaptable`.

`.aspect-4-3`
Works with the `.aspect` container. Sets a 4:3 ratio for an adaptable-size object.

`.embed`
Expands a normally fixed-size embeddable object to fill the available width.
Defaults to applying this to images, videos, iframes and anything you tag with ".embed".

*Warning* This is applied by default to the following tags:
 - `img`,
 - `audio`,
 - `video`,
 - `iframe`,