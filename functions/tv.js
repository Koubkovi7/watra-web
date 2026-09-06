import {redirectTo} from './index.js';
export function onRequest({request}) {
  return redirectTo(request,'/cs/',{utm_source:'tv',utm_medium:'broadcast',utm_campaign:'reportaz'});
}
