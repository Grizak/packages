const METADATA =
  /(^|\/)(dists|repodata)\/|(^|\/)(grizak\.(db|files)(\.tar\.zst)?(\.sig)?|InRelease|Release(\.gpg)?|repomd\.xml(\.asc)?|Packages(\.gz)?)$|^(index\.html|index\.json)$/;
const PACKAGE = /\.(deb|rpm|pkg\.tar\.zst)(\.sig)?$/;

function cacheFor(key) {
  if (METADATA.test(key)) return "no-cache"; // changes on every publish
  if (PACKAGE.test(key)) {
    return "public, max-age=31536000, immutable"; // never changes once published
  }
  return "public, max-age=300";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let key = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (key === "" || key.endsWith("/")) key += "index.html";

    const obj = await env.REPO.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("etag", obj.httpEtag);
    headers.set("Cache-Control", cacheFor(key));
    return new Response(obj.body, { headers });
  },
};
