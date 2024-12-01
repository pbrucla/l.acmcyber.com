const panel_html = `<!DOCTYPE html>
<html>
<head>
    <title>l.acmcyber.com redirect panel</title>
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.4.1/css/all.css" integrity="sha384-5sAR7xN1Nv6T6+dT2mhtzEpVJvfS3NScPQTrOxhwjIuvcA67KV2R5Jz6kr4abQsz" crossorigin="anonymous">
    <style>
        html, body {
            display: flex;
            justify-content: center;
            height: 100%;
        }
        body, div, h1, form, input, label, p {
            padding: 0;
            margin: 0;
            outline: none;
            font-family: Roboto, Arial, sans-serif;
            font-size: 16px;
            color: #666;
        }
        h1 {
            padding: 10px 0;
            font-size: 32px;
            font-weight: 300;
            text-align: center;
        }
        p {
            font-size: 12px;
        }
        .main-block {
            min-width: 340px;
            padding: 10px 0;
            margin: auto;
            border-radius: 5px;
            border: solid 1px #ccc;
            box-shadow: 1px 2px 5px rgba(0,0,0,.31);
            background: #ebebeb;
        }
        form {
            margin: 0 30px;
        }
        input[type=url], input[type=text] {
            width: 100%;
            height: 36px;
            margin: 13px 0 0 -5px;
            padding-left: 10px;
            border-radius: 0 5px 5px 0;
            border: solid 1px #cbc9c9;
            box-shadow: 1px 2px 5px rgba(0,0,0,.09);
            background: #fff;
        }
        .btn-block {
            margin-top: 10px;
            text-align: center;
        }
input[type=checkbox] {
        margin-top: 20px;
}
        button {
            width: 100%;
            padding: 10px 0;
            margin: 10px auto;
            border-radius: 5px;
            border: none;
            background: #1c87c9;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
        }
        button:hover {
            background: #26a9e0;
        }
    </style>
</head>
<body>
<div class="main-block">
    <h1>Add URL redirect</h1>
    <form action="/" method="post">
        <input type="url" name="url" id="url" placeholder="URL" required/>
        <input type="text" name="path" id="path" placeholder="case/insensitive/path/for/redirect" required/>
        <input type="checkbox" name="overwrite" id="overwrite" />
        <label for="overwrite">Overwrite existing URL</label>
        <div class="btn-block">
            <button type="submit" href="/">Submit</button>
        </div>
    </form>
</div>
</body>
</html>`

let response_header = {
	'content-type': 'text/html;charset=UTF-8',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST'
};

let json_response_header = {
	'content-type': 'text/json;charset=UTF-8',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST'
}; 

async function save_url(URL, path) {
	return await LINKS.put(`/${path}`, URL);
}
async function is_valid_path(path) {
	const path_regex = /^[-a-zA-Z0-9_.+/]+$/gm;
	return path_regex.test(path);
}

async function check_existing_path(path) {
	return await LINKS.get(`/${path}`);
}

/**
 * readRequestBody reads in the incoming request body
 * Use await readRequestBody(..) in an async function to get the string
 * @param {Request} request the incoming request to read from
 */
async function readRequestBody(request) {
  const contentType = request.headers.get("content-type");
  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json());
  } else if (contentType.includes("application/text")) {
    return request.text();
  } else if (contentType.includes("text/html")) {
    return request.text();
  } else if (contentType.includes("form")) {
    const formData = await request.formData();
    const body = {};
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1];
    }
    return body;
  } else {
    // Perhaps some other type of data was submitted in the form
    // like an image, or some other binary data.
    return "a file";
  }
}

async function handleRequest(request) {
	console.log(request);
	if (request.method === 'POST') {
		let req = await readRequestBody(request);
    console.log(req);
		if (!is_valid_path(req['path'])) {
			return new Response(`{"status":400,"msg":"Invalid custom url path"}`, {
				headers: json_response_header
			});
		}
		if (req['url'] === undefined) {
			return new Response(`{"status":400,"msg":"Missing url redirect"}`, {
				headers: json_response_header
			});
		}
		console.log(
			`Request from ${request.headers.get('CF-Connecting-IP')}: Shorten URL '${req['url']}' to '/${req['path']}`
		);
    if (!('overwrite' in req)) {
      const existing = await check_existing_path(req['path']);
      if (existing) {
        return new Response(
          `{"status":409,"msg":"The path already exists, and overwriting is disabled."}`,
          { headers: json_response_header }
        );
      }
    }

		const stat = await save_url(req['url'], req['path']);
		if (stat === undefined) {
			return new Response(`{"status":200,"url":"https://l.acmcyber.com/${req['path']}"}`, {
				headers: json_response_header
			});
		} else {
			console.log(stat);
			return new Response(
				`{"status":503,"key":": Error: an unknown error occured while trying to write to the database. Has the write limit been reached?"}`,
				{
					headers: json_response_header
				}
			);
		}
	} else if (request.method === 'OPTIONS') {
		return new Response(``, {
			headers: response_header
		});
	}

  return new Response(await panel_html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8'
    }
  });
}

addEventListener('fetch', async (event) => {
	event.respondWith(handleRequest(event.request));
});
