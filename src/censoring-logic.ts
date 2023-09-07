import * as BetaCensorship from '@silveredgold/beta-censor-client';
import fs from 'fs';
import crypto from 'crypto';

export default class CensoringLogic {

	/** Référence au serveur. */
	server: BetaCensorship.BetaCensorClient | null = null;

	config: any | null = null;

	extensions:Object = {};

	/** Crée la connexion à l'instance BetaCensoring */
	initServer():void {
		this.server = new BetaCensorship.BetaCensorClient('http://localhost:2382');
		this.config = JSON.parse(fs.readFileSync('./censoring-prefs.json', 'utf8') || '{}');
		this.server.onImageCensored.subscribe(async (_sender, payload) => {
			if(payload && !payload.error) {
				this.saveURLDataToFile(payload.url, './output', payload.id);
			}
		});
	}

	/** Sauvegarde les données au format URL base64 dans un fichier image. */
	saveURLDataToFile(dataurl:string, fileDir:string, id:string):void {
		const regex = /^data:.+\/(.+);base64,(.*)$/;
		let matches:RegExpMatchArray | null = dataurl.match(regex);
		if(matches) {
			let ext = matches[1];
			let data = matches[2];
			let buffer = Buffer.from(data, 'base64');
			fs.writeFileSync(fileDir + '/data.' + ext, buffer);
			this.extensions[id] = ext;
		}
	}

	/** Renvoie le domaine de l'URL spécifiée. */
	getDomainOfURL(url:string):string {
		console.log('url ====> ', url);
		let domain = (new URL(url));
		return domain.hostname.replace('www.','');
	}

	/** Méthode principale : applique le traitement de l'image sur l'URL spécifiée. */
	async treatImage(url:string, out:Object):Promise<boolean> {
		if(!this.server) { return false; }
		const transactionId = crypto.randomUUID();
		console.log(transactionId);
		let result = await this.server.censorImage({
			id: transactionId,
			srcId: transactionId,
			force: false,
			url: url,
			srcUrl: url,
			preferences: this.config,
			context: {
				domain: this.getDomainOfURL(url)
			}
		}).then(() => { return true; }).catch(() => { return false; })
		return result;
	}
};