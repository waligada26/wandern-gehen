//  The single owner of content loading: import the raw data, validate
//  it once, export the validated object. Game, Camp, and anything else
//  that reads content imports from HERE — validation is a real load
//  stage with one owner, not a side effect of whichever module
//  happened to be imported first.
import raw from './content.json';
import { validateContent } from './content-validate';

export const content = validateContent(raw);
