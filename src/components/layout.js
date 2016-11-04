define(function(){
	function Layout(){
        this.Layout = {
            NODISPLAY: 'nodisplay',
            FIXED: 'fixed',
            FIXED_HEIGHT: 'fixed-height',
            RESPONSIVE: 'responsive',
            CONTAINER: 'container',
            FILL: 'fill',
            FLEX_ITEM: 'flex-item'
        };
        this._naturalDimensions = {
          'mip-pix': {width: '1px', height: '1px'},
          'mip-stats': {width: '1px', height: '1px'},
          // TODO: audio should have width:auto.
          'mip-audio': null,
          'mip-share': {width: '60px', height: '44px'}
        };
        this._LOADING_ELEMENTS = {
            'mip-anim': true,
            'mip-brightcove': true,
            'mip-embed': true,
            'mip-iframe': true,
            'mip-img': true,
            'mip-list': true,
            'mip-video': true
        };
    }
    /**
     * @param {string} s
     * @return {Layout|undefined} Returns undefined in case of failure to parse
     *   the layout string.
     */
    Layout.prototype.parseLayout = function(s) {
      for (var i in this.Layout) {
        if (this.Layout[i] == s) {
          return s;
        }
      }
      return undefined;
    }

    /**
     * @param {!Layout} layout
     * @return {string}
     */
    Layout.prototype.getLayoutClass = function(layout) {
      return 'mip-layout-' + layout;
    }

    /**
     * Whether an element with this layout inherently defines the size.
     * @param {!Layout} layout
     * @return {boolean}
     */
    Layout.prototype.isLayoutSizeDefined = function (layout) {
      return (layout == this.Layout.FIXED ||
          layout == this.Layout.FIXED_HEIGHT ||
          layout == this.Layout.RESPONSIVE ||
          layout == this.Layout.FILL ||
          layout == this.Layout.FLEX_ITEM);
    }
    /**
     * Whether the tag is an internal (service) AMP tag.
     * @param {!Node|string} tag
     * @return {boolean}
     */
     Layout.prototype.isInternalElement = function (tag) {
      var tagName = (typeof tag == 'string') ? tag : tag.tagName;
      return tagName && tagName.toLowerCase().indexOf('mip-i-') == 0;
    }

    /**
     * Parses the CSS length value. If no units specified, the assumed value is
     * "px". Returns undefined in case of parsing error.
     * @param {string|undefined} s
     * @return {!LengthDef|undefined}
     */
    Layout.prototype.parseLength = function(s) {
      if (typeof s == 'number') {
        return s + 'px';
      }
      if (!s) {
        return undefined;
      }
      if (!/^\d+(\.\d+)?(px|em|rem|vh|vw|vmin|vmax|cm|mm|q|in|pc|pt)?$/.test(s)) {
        return undefined;
      }
      if (/^\d+(\.\d+)?$/.test(s)) {
        return s + 'px';
      }
      return s;
    }


    /**
     * Returns units from the CSS length value.
     * @param {!LengthDef} length
     * @return {string}
     */
    Layout.prototype.getLengthUnits = function(length) {
      var unit = length.match(/[a-z]+/i);
      return unit[0];
    }


    /**
     * Returns the numeric value of a CSS length value.
     * @param {!LengthDef|string} length
     * @return {number}
     */
    Layout.prototype.getLengthNumeral = function(length) {
      return parseFloat(length);
    }


    /**
     * Determines whether the tagName is a known element that has natural dimensions
     * in our runtime or the browser.
     * @param {string} tagName The element tag name.
     * @return {DimensionsDef}
     */
    Layout.prototype.hasNaturalDimensions = function(tagName) {
      tagName = tagName.toUpperCase();
      return this._naturalDimensions[tagName] !== undefined;
    }


    /**
     * Determines the default dimensions for an element which could vary across
     * different browser implementations, like <audio> for instance.
     * This operation can only be completed for an element whitelisted by
     * `hasNaturalDimensions`.
     * @param {!Element} element
     * @return {DimensionsDef}
     */
    Layout.prototype.getNaturalDimensions = function(element) {
      var tagName = element.tagName.toLowerCase();
      if (!this._naturalDimensions[tagName]) {
        var doc = element.ownerDocument;
        var naturalTagName = tagName.replace(/^mip\-/, '');
        var temp = doc.createElement(naturalTagName);
        // For audio, should no-op elsewhere.
        temp.controls = true;
        temp.style.position = 'absolute';
        temp.style.visibility = 'hidden';
        doc.body.appendChild(temp);
        this._naturalDimensions[tagName] = {
          width: (temp.offsetWidth || 1) + 'px',
          height: (temp.offsetHeight || 1) + 'px',
        };
        doc.body.removeChild(temp);
      }
      return this._naturalDimensions[tagName];
    }


    /**
     * Whether the loading can be shown for the specified elemeent. This set has
     * to be externalized since the element's implementation may not be
     * downloaded yet.
     * @param {string} tagName The element tag name.
     * @return {boolean}
     */
    Layout.prototype.isLoadingAllowed = function(tagName) {
      return this._LOADING_ELEMENTS[tagName.toLowerCase()] || false;
    }

    Layout.prototype.applyLayout = function (element) {
        var layoutAttr = element.getAttribute('layout');
        var widthAttr = element.getAttribute('width');
        var heightAttr = element.getAttribute('height');
        var sizesAttr = element.getAttribute('sizes');
        var heightsAttr = element.getAttribute('heights');

        // Input layout attributes.
        var inputLayout = layoutAttr ? this.parseLayout(layoutAttr) : null;
        var inputWidth = (widthAttr && widthAttr != 'auto') ?
            this.parseLength(widthAttr) : widthAttr;
        var inputHeight = heightAttr ? this.parseLength(heightAttr) : null;

        // Effective layout attributes. These are effectively constants.
        var width;
        var height;
        var layout;

        // Calculate effective width and height.
        if ((!inputLayout || inputLayout == this.Layout.FIXED ||
            inputLayout == this.Layout.FIXED_HEIGHT) &&
            (!inputWidth || !inputHeight) && this.hasNaturalDimensions(element.tagName)) {
          // Default width and height: handle elements that do not specify a
          // width/height and are defined to have natural browser dimensions.
          var dimensions = this.getNaturalDimensions(element);
          width = (inputWidth || inputLayout == this.Layout.FIXED_HEIGHT) ? inputWidth :
              dimensions.width;
          height = inputHeight || dimensions.height;
        } else {
          width = inputWidth;
          height = inputHeight;
        }

        // Calculate effective layout.
        if (inputLayout) {
          layout = inputLayout;
        } else if (!width && !height) {
          layout = this.Layout.CONTAINER;
        } else if (height && (!width || width == 'auto')) {
          layout = this.Layout.FIXED_HEIGHT;
        } else if (height && width && (sizesAttr || heightsAttr)) {
          layout = this.Layout.RESPONSIVE;
        } else {
          layout = this.Layout.FIXED;
        }

        

        // Apply UI.
        element.classList.add(this.getLayoutClass(layout));
        if (this.isLayoutSizeDefined(layout)) {
          element.classList.add('mip-layout-size-defined');
        }
        if (layout == this.Layout.NODISPLAY) {
          element.style.display = 'none';
        } else if (layout == this.Layout.FIXED) {
          element.style.width = width;
          element.style.height = height;
        } else if (layout == this.Layout.FIXED_HEIGHT) {
          element.style.height = height;
        } else if (layout == this.Layout.RESPONSIVE) {
          var space = element.ownerDocument.createElement('mip-i-space');
          space.style.display = 'block';
          space.style.paddingTop =
              ((this.getLengthNumeral(height) / this.getLengthNumeral(width)) * 100) + '%';
          element.insertBefore(space, element.firstChild);
          element._spaceElement = space;
        } else if (layout == this.Layout.FILL) {
          // Do nothing.
        } else if (layout == this.Layout.CONTAINER) {
          // Do nothing. Elements themselves will check whether the supplied
          // layout value is acceptable. In particular container is only OK
          // sometimes.
        } else if (layout == this.Layout.FLEX_ITEM) {
          // Set height and width to a flex item if they exist.
          // The size set to a flex item could be overridden by `display: flex` later.
          if (width) {
            element.style.width = width;
          }
          if (height) {
            element.style.height = height;
          }
        }
        return layout;
    };


    return new Layout();
});