
// This is adapted from: https://github.com/ondras/rot.js/blob/master/manual/manual.js

var converter = new showdown.Converter();
converter.setFlavor('github');

var CURRENT_EXAMPLE = null;
document.addEventListener("click", function() {
	if (CURRENT_EXAMPLE) { CURRENT_EXAMPLE.close(); }
}, false);


class Example {
	constructor(node) {
		this._source = $(node);
		this._source.attr("data-syntax", "js");

		this._node = this._source.parent();
		this._node.addClass('example');

		this._ta = $("<textarea></textarea>").addClass('code');
		this._ta.spellcheck = false;

		this._result = $("<code></code>").addClass("result javascript language-javascript");
		this._time = $("<div></div>").addClass('time');

		this._useCode(node.textContent);
	}

	click(e) {
		e.stopPropagation();
		if (CURRENT_EXAMPLE !== this) { this.open(); }
	}

	open() {
		CURRENT_EXAMPLE = this;

		const height = this._source.height();
		const width  = this._source.width();
		const text = this._source.text();
		this._ta.height(height);
		this._ta.width(width);
		this._ta.text(text);
		this._source.replaceWith(this._ta);
		this._ta.on('click', this.click.bind(this));
		this._ta.focus();
	}

	close() {
		CURRENT_EXAMPLE = null;
		const code = this._ta.val();
		this._useCode(code);
	}

	/**
	 * @param {string} code no html entities, plain code
	 */
	_useCode(code) {
		this._node.html('');
		this._result.html('');
		this._source.html('');
		this._node.append(this._source);
		this._node.append('<br>');
		this._node.append(this._result);
		this._node.append(this._time);

		this._source.on('click', this.click.bind(this));
		
		this._source.append(code);
		hljs.highlightBlock(this._source[0]);

		const result = this._result;
		function show() {
			for (var i=0;i<arguments.length;i++) {
				var arg = arguments[i];
				if (!arg) {
					arg = $('<div></div>').html(JSON.stringify(arg));
				}
				else if (arg.node) {
					arg = arg.node;
				}
				else if (!arg.nodeType) {
					if (!Array.isArray(arg) && typeof arg == 'object') {
						if (arg.stack) {
							arg = arg.stack;
						}
						else {
							arg = JSON.stringify(arg);
						}
					}
					arg = $("<div></div>").html(arg);
				}
				result.append(arg);
			}
		};

		var t1 = Date.now();
		this._eval(code, show);
		var t2 = Date.now();
		this._time.html(`executed in ${t2-t1}ms`);
	}

	_eval(code, SHOW) {
		try {
		    eval(code);
		} catch (e) {
		  SHOW(e);
		}
	}
}



var Manual = {
	_hash: "",
	_hashChange: function(e) {
		var hash = location.hash || "intro";
		if (hash.charAt(0) == "#") { hash = hash.substring(1); }
		if (hash == this._hash) { return; }
		this._hash = hash;

		this._switchTo(this._hash);
	},

	_switchTo: function(what) {
		$.get("pages/" + what + ".md?" + Math.random(), this._response.bind(this));

		$("#menu a").each( function(i) {
			const $link = $(this);
			const href = $link.prop('href');
			if (href.lastIndexOf(what) == href.length - what.length) {
				$link.addClass("active");
				const $parent = $link.parent().parent().parent();
				if ($parent.is("li")) {
					$parent.children("a").addClass("active");
				}
			} else {
				$link.removeClass("active");
			}
		});
	},

	_response: function(data, status) {
		if (status != 'success') { return; }
		document.body.scrollTop = 0;
		document.documentElement.scrollTop = 0;

		let html = converter.makeHtml(data)
		$("#content").html(html);

		$("#content pre code.js").each( function(i) {
			new Example(this);
		});
	},

	init: function() {
		var year = new Date().getFullYear();
		$("#year").html(year);

		$.get("VERSION", function(data, status) {
			if (status != 200) { return; }
			$("h1").html("<span>v" + data.trim() + "</span>");
		});

		window.onhashchange = this._hashChange.bind(this);
		this._hashChange();
	}

}

window.onload = (() => Manual.init());
