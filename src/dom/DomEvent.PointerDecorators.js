import * as Util from '../core/Util';
import * as Browser from '../core/Browser';



var pointerifyMouse = {
	mousedown:  'pointerdown',
	mouseup:    'pointerup',
	mousemove:  'pointermove',

	mouseover:  'pointerover',
	mouseenter: 'pointerenter',
	mouseout:   'pointerout',
	mouseleave: 'pointerleave'
};

var pointerifyTouch = {
	touchstart:  'pointerdown',
	touchend:    'pointerup',
	touchmove:   'pointermove',

	touchcancel: 'pointercancel',
};

var pointerifyLegacy = {
	MSPointerDown:   'pointerdown',
	MSPointerUp:     'pointerup',
	MSPointerMove:   'pointermove',

	MSPointerOver:   'pointerover',
	MSPointerEnter:  'pointerenter',
	MSPointerOut:    'pointerout',
	MSPointerLeave:  'pointerleave',
	MSPointerCancel: 'pointercancel'
};


// // Borrowed from prosthetic-hand
// var mouseEventConstructor = true;
//
// try {
// 	var foo = new MouseEvent('mousedown');
// } catch (e) {
// 	mouseEventConstructor = false;
// }


var pointerifyMap = {};
var pointerifyReverseMap = {};

if (Browser.msPointer || !Browser.pointer) {

	pointerifyMap = Util.extend({}, pointerifyMouse);

	if (Browser.touch) {
		pointerifyMap = Util.extend(pointerifyMap, pointerifyTouch);
	}

	if (Browser.msPointer) {
		pointerifyMap = Util.extend(pointerifyMap, pointerifyLegacy);
	}

	for (var type in pointerifyMap) {
		var p = pointerifyMap[type];
		if (p in pointerifyReverseMap) {
			pointerifyReverseMap[p].push(type);
		} else {
			pointerifyReverseMap[p] = [type];
		}
	}
}

// Turns a non-pointer event name into a pointer event name.
// Used to:
// * Fire Leaflet events from non-pointer native events
// e.g. if a 'mousedown' native event is caught, then fire a 'pointerdown'
// * Listen to pointer events when asked to listen to a legacy event
// e.g. on('mousedown', ...) → on ('pointerdown', ...)
export function pointerify(type) {
// 	console.log('pointerify', type, pointerifyMap[type] || type);
	return pointerifyMap[type] || type;
}

// Given a handler function that expects a pointer event, return a function that
// expects a legacy event instead, decorates the legacy event, then runs the
// original handler.
export function pointerifyHandler(type, fn) {
	if (type in pointerifyMap) {
		if (type in pointerifyMouse) {
// 			console.log('decorating mouse handler', type, fn);
			return decorateMouse(fn);
		}
		if (type in pointerifyTouch) {
// 			console.log('decorating touch handler', type, fn);
			return decorateTouch(fn);
		}
	}
	return fn;
}

// Turns a pointer event name into an array of non-pointer event names, according
// to this browser's capabilities. e.g. pointerdown → [mousedown, touchstart]
// Used to listen to native legacy events when asked to listen to a pointer event.
export function unpointerify(type) {
	return pointerifyReverseMap[type] || [type];
}


var mouseDecorations = {
	// Static things for PointerEvent
	pointerType: 'mouse',
	isPrimary: true,
	tiltX:     0,
	tiltY:     0,
	pointerId: 1,
	width:     1,
	height:    1,
	pressure:  0.5
};

// Expecting a handler for a `PointerEvent` as a parameter,
// returns a handler function that expects a `MouseEvent`.
function decorateMouse(fn) {
	return function mouseEvToPointerEv(ev) {
		return fn(Util.extend(ev, mouseDecorations));
	};
}

// Things that a `PointerEvent` needs to have, but are not provided by
// a `TouchEvent` or any of its `Touch`es
var touchDecorations = {
	// Static things for PointerEvent
	tiltX: 0,
	tiltY: 0,
	pointerType: 'touch',
	isPrimary: false,

	// Static things for MouseEvent
	button: 0,
	buttons: 1,
};

// Expecting a handler for a `PointerEvent` as a parameter,
// returns a handler function that expects a `TouchEvent`.
// The wrapper `TouchEvent` handler might call the wrapped `PointerEvent` handler
// more than once, as a `TouchEvent` has several `Touch`es
function decorateTouch(fn) {
	return function touchEvToPointerEv(ev) {
		for (var i = 0, len = ev.targetTouches.length; i < len; i++) {
			var touch = ev.targetTouches[i];
			// Instead of creating a new event, decorate the TouchEvent and
			// handle that several times. This makes stopPropagation() and preventDefault()
			// work properly
			var evData = Util.extend(ev, {
				// Dynamic things for PointerEvent
				pointerId: touch.identifier,
				width:     touch.radiusX,
				height:    touch.radiusY,
				pressure:  touch.force,

				// Dynamic things for MouseEvent, as the PointerEvent inherits from it
				clientX: touch.clientX,
				clientY: touch.clientY,
// 				altKey	// Already in TouchEvent
// 				ctrlKey	// Already in TouchEvent
// 				metaKey	// Already in TouchEvent
// 				shiftKey	// Already in TouchEvent
				movementX: 0,	// / TODO: Keep track of this manually???
				movementY: 0,
				offsetX: 0,	// / TODO: must calculate based on target geometry
				offsetY: 0,
				pageX: touch.pageX,
				pageY: touch.pageY,
// 				target: ev.target,	// Can not overwrite
// 				relatedTarget	/// TODO: Keep track of this manually???
				screenX: touch.screenX,
				screenY: touch.screenY,
			}, touchDecorations/* , ev*/);

			fn(evData);
		}
	};
}


// / TODO: Create a decorateMSPointer decorator, just to convert the `pointerType`
// / property from MSPOINTER_TYPE_MOUSE into 'mouse'





