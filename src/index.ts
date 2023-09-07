import CensoringLogic from "./censoring-logic";
import CensorProxy from "./proxy";

let censoringLogic = new CensoringLogic();
censoringLogic.initServer();

let p = new CensorProxy();
p.initServer(async (url:string, out:Object) => {
	let result = await censoringLogic.treatImage(url, out);
	return result;
});
//let result = await censoringLogic.treatImage('https://i.redd.it/n6inx3mmximb1.jpg'); // https://i.redd.it/6bi8nnsh1nmb1.jpg
//console.log(result);
p.close();

