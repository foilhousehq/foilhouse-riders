import {mkdir,readFile,writeFile} from 'node:fs/promises';
const html=await readFile('dist/index.html','utf8');for(const route of ['riders','rider-login','auth/callback','auth/confirm']){await mkdir('dist/'+route,{recursive:true});await writeFile('dist/'+route+'/index.html',html)}await writeFile('dist/404.html',html);await writeFile('dist/.nojekyll','');
