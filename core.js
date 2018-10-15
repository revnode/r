/* global is_null is_string is_undefined is_json CustomEvent localStorage fetch */

const uuid = function()
{
	return Math.random().toString(36).substring(2);
};
const type_of = function(a)
{
	const t = Object.prototype.toString.call(a).slice(8, -1).toLowerCase();
	return (t.indexOf('html') > -1 ? 'element' : t);
};
const empty = function(a)
{
	switch(type_of(a))
	{
		case 'string':
			return (
				a === '' ||
				a === '0' ||
				a.toLowerCase() === 'false' ||
				a.toLowerCase() === 'null'
			);
		
		case 'object':
			return empty(Object.keys(a));
		
		case 'arguments':
		case 'array':
		case 'nodelist':
		case 'domtokenlist':
			return (a.length === 0);
			
		case 'element':
			return !a.hasChildNodes();
		
		case 'number':
			return (a === 0);
			
		case 'boolean':
			return !a;
		
		case 'function':
			return (a.toString() === (function(){}).toString());
		
		case 'date':
		case 'textnode':
		case 'regexp':
			return false;
		
		case 'whitespace':
		default:
			return true;
	}
};

for(const t of [
	'element',
	'nodelist',
	'arguments',
	'array',
	'object',
	'string',
	'number',
	'date',
	'boolean',
	'function',
	'regexp',
	'null',
	'undefined'
])
{
	window[`is_${t}`] = function(a)
	{
		return (t == type_of(a));
	};
}
window.is_json = (s) => (is_string(s) && (s[0] == '{' || s[0] == '['));

(function()
{
	function jsml(a)
	{
		switch(type_of(a))
		{
			case 'object':
				for(const k in a)
				{
					const v = a[k];
					
					if(!is_null(v))
					{
						switch(k)
						{	
							case 'c':
							case 'classes':
								for(const c of (is_string(v) ? v.split(' ') : v)) this.classList.add(c);
								break;
							
							case 's':
							case 'styles':
								for(const p in v) this.style[p] = v[p];
								break;
							
							case 'e':
							case 'events':
								for(const t in v) this.addEventListener(t, v[t]);
								break;
							
							default:
								if(v !== false && !is_undefined(v) && !is_null(v))
								{
									this.setAttribute(k.replace('_', '-'), v);
								}
								break;
						}
					}
				}
				break;
			
			case 'instance':
				var flagged = false;
				for(const type of ['element', 'array', 'string', 'number', 'function'])
				{
					if(!flagged && a[`to_${type}`])
					{
						jsml.call(this, a[`to_${type}`]());
						flagged = true;
					}
				}
				break;
			
			case 'function':
				jsml.call(this, a());
				break;
			
			case 'array':
				for(const b of a) jsml.call(this, b);
				break;
			
			case 'string':
			case 'number':
				this.innerHTML = a;
				break;
			
			case 'element':
				this.appendChild(a);
				break;
		}
	}
	
	const jsml_wrap = function()
	{
		const n = document.createElement(this);
			for(const a of arguments)
			{
				jsml.call(n, a);
			}
		return n;
	};
	for(const t of [
		'a', 'article',
		'b', 'br', 'button',
		'div',
		'em',
		'fieldset', 'footer', 'form',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr',
		'i', 'iframe', 'img', 'input',
		'label', 'li',
		'nav',
		'object', 'ol', 'optgroup', 'option',
		'p',
		'section', 'select', 'span', 'strong', 'svg',
		'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'tr',
		'u', 'ul'
	])
	{
		if(!window[t])
		{
			window[t] = jsml_wrap.bind(t);
		}
	}
})();

const $ = (s, p) => (is_string(s) ? (p || document).querySelector(s) : s);
Object.assign($, {
	$: (s, p) => (is_string(s) ? (p || document).querySelectorAll(s) : s),
	
	$$(f)
	{
		return document.createRange().createContextualFragment(f);
	},
	
	_(el)
	{
		el = $(el);
		while(el.firstChild) el.removeChild(el.firstChild);
		return el;
	},
	
	__(el, target)
	{
		el = $(el);
		if(target)
		{
			target.parentNode.replaceChild(el, target);
			return target;
		}
		else
		{
			el.parentNode.removeChild(el);
		}
	},
	
	on(el, t, l, u)
	{
		(el = $(el)).addEventListener(t, l, !!u);
		return el;
	},
	
	off(el, t, l, u)
	{
		(el = $(el)).removeEventListener(t, l, !!u);
		return el;
	},
	
	emit(el, t, b, c, d)
	{
		(el = $(el)).dispatchEvent(new CustomEvent(t, !!b, !!c, d || {}));
		return el;
	},
	
	open(el, d)
	{
		(el = $(el)).style.display = (d || 'block');
		return el;
	},
	
	close(el)
	{
		(el = $(el)).style.display = 'none';
		return el;
	},
	
	show(el)
	{
		(el = $(el)).style.visibility = 'visible';
		return el;
	},

	hide(el)
	{
		(el = $(el)).style.visibility = 'hidden';
		return el;
	},
	
	visible(el)
	{
		el = $(el);
		return !(el.style.display == 'none' || el.style.visibility == 'hidden');
	},
	
	has()
	{
		return [].slice.call(arguments).every(a => !is_null($.get(a)));
	},
	
	get()
	{
		if(arguments.length == 1)
		{
			const value = localStorage.getItem(arguments[0]);
			return (is_json(value) ? JSON.parse(value) : value);
		}
		else
		{
			return [].slice.call(arguments).map(a => $.get(a));
		}
	},
	
	set: (key, value) => (
		is_undefined(key) ?
		localStorage.clear() :
		(
			is_string(key) ?
			(
				is_undefined(value) ?
				localStorage.removeItem(key) :
				localStorage.setItem(key, (
					typeof value == 'object' ?
					JSON.stringify(value) :
					value
				))
			) :
			Object.keys(key).forEach(i => $.set(i, key[i]))
		)
	),
	
	fetch(request)
	{
	  const options = {
	    headers:
	    {
  	    'Content-Type': 'application/json'
  	  }
	  };
	  if(typeof request === 'string')
	  {
	  	request = {url: request};
	  }
	  for(let key of ['headers', 'method', 'body'])
	  {
	    if(request[key])
  	  {
  	    options[key] = request[key];
  	  }
	  }
	  if(
	  	(!options.method || options.method === 'GET') &&
	  	options.body
	  )
	  {
	  	options.body = Object
	  		.keys(options.body)
	  		.filter(k => options.body[k])
	  		.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(options.body[k])}`)
    		.join('&');
    	if(options.body.length)
    	{
    		options.url += `?${options.body}`;
    	}
    	delete options.body;
	  }
	  if(
	    options.body &&
	    typeof options.body === 'object' &&
	    options.body.forEach
	  )
	  {
	    let json = {};
      for(const [key, value] of options.body.entries())
      {
        json[key] = value;
      }
      options.body = json;
	  }
	  if(options.body && typeof options.body === 'object')
	  {
	    options.body = JSON.stringify(options.body);
	  }
	  return fetch(request.url, options).then(response =>
	  {
	  	if(response.status >= 400)
	  	{
	  		throw response;
	  	}
	  	switch(options.headers['Content-Type'])
	  	{
	  		case 'application/json':
	  			return response.json();
	  		case 'text/html':
	  			return response.text();
	  		default:
	  			return response.blob();
	  	}
    }).catch(response => console.error(response));
	}
});
