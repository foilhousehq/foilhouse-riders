import {cp} from 'node:fs/promises';await cp('source/dist','.',{recursive:true});
