import httpProxy from 'http-proxy';
import http, { IncomingMessage, ServerResponse } from 'http';
import modifyResponse from 'http-proxy-response-rewrite';

const IMAGE_EXTENSIONS = [ 'png', 'jpg', 'jpeg', 'gif', 'webp' ];

export default class CensorProxy {

	/** Création du proxy. */
	initServer(treatImageCallback:Function):Object {
		let proxy = httpProxy.createProxyServer();
		proxy.on('error', (err, req, res) => {
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('Something went wrong. And we are reporting a custom error message.');
		});

		// Le premier serveur (celui qui est sollicité) va transmettre l'élément au second qui va être chargé de la modification.
		http.createServer((req, res) => { proxy.web(req, res, { target: 'http://localhost:9008' }); }).listen(8001);

		// Le second serveur, qui modifie la réponse avant de la transmettre au client.
		http.createServer(async (req:IncomingMessage, res:ServerResponse) => {
			let finalizedURL = 'http://' + req.headers.host + req.url;
			let outputPrefs = {};
			let result = await treatImageCallback(finalizedURL, outputPrefs);
			res.writeHead(200, { 'Content-Type':  })
			// treatImageCallback();
			/*res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.write('request successfully proxied to: ' + req.url + '\n' + JSON.stringify(req.headers));
			res.end()*/
		}).listen(9008);


		
		
		
		// Create your proxy server and set the target in the options.
		/*httpProxy.createProxyServer({target:'http://localhost:9000'}).listen(8001);
		http.createServer((req, res) => {
			res.writeHead(200, { 'Content-Type': 'text/plain' });
			res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers));
			res.end();
		}).listen(9000);*/

		return {};
	}

	/** Handler de requête. */
	onRequest(proxyRes, req, res):void {
		console.log("ON REQUEST");
		let body:Uint8Array[] = [];
        proxyRes.on('data', (chunk:Uint8Array) => { body.push(chunk); });
        proxyRes.on('end', () => {
			let finalStr = Buffer.concat(body).toString();
            console.log("res from proxied server:", finalStr);
            res.end("my response to cli");
        });
		/*
		modifyResponse(res, proxyRes.headers['content-encoding'], (body:string) => {
			console.log('modifyResponse', res, req);
			if (body && (body.indexOf("<process-order-response>")!= -1)) {
				let beforeTag = "</receipt-text>"; //tag after which u can add data to 
				let beforeTagBody = body.substring(0,(body.indexOf(beforeTag) + beforeTag.length));
				let requiredXml = " <ga-loyalty-rewards>\n"+
					"<previousBalance>0</previousBalance>\n"+
					"<availableBalance>0</availableBalance>\n"+
					"<accuruedAmount>0</accuruedAmount>\n"+
					"<redeemedAmount>0</redeemedAmount>\n"+                                   
					"</ga-loyalty-rewards>";
				let afterTagBody = body.substring(body.indexOf(beforeTag)+  beforeTag.length);
				let res:Array<string> = [];
				res.push(beforeTagBody, requiredXml, afterTagBody);    
				console.log(res.join(""));
				return res.join("");
			}
			return body;
		});
		*/
	}

	/** Indique si l'URL spécifiée est celle d'une image. */
	isImage(url) {
		return (IMAGE_EXTENSIONS.find((ext) => { return url.endsWith(ext); }));
	}

	close() {}
};