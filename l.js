const html404 = `<!DOCTYPE html>
<body>
  <h1>404 Not Found.</h1>
  <p>The url you attempted to visit does not exist.</p>
</body>`;

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
async function handleRequest(request) {
	if (request.method === 'OPTIONS') {
		return new Response(``, {
			headers: response_header
		});
	}

	const requestURL = new URL(request.url);
	const casePath = requestURL.pathname;

	// if (casePath === "/robots.txt") {
	// 	return new Response("User-agent: *\nDisallow: /");
	// }

	

	const path = casePath.toLowerCase();
	// console.log(path);

	const dest = await LINKS.get(path);

	if (dest) {
		return Response.redirect(dest);
	}
	// If request not in kv, return 404
	return new Response(html404, {
		headers: {
			'content-type': 'text/html;charset=UTF-8'
		},
		status: 404
	});
}

addEventListener('fetch', async (event) => {
	event.respondWith(handleRequest(event.request));
});
